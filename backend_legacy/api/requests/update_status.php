<?php
// backend/api/requests/update_status.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/activity_logger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed. Only POST is supported.', 405);
}

// Only Staff (Admin / Super Admin) can approve/reject
$user = JWT::requireRole(['admin', 'superadmin']);

$input = Utils::getJsonInput();
$requestId = $input['request_id'] ?? null;
$status = $input['status'] ?? ''; // 'approved', 'rejected', 'completed'
$remarks = trim($input['remarks'] ?? '');

if (!$requestId || !in_array($status, ['approved', 'rejected', 'completed'])) {
    Response::badRequest('Please provide a valid request ID and status (approved, rejected, completed).');
}

try {
    $db = Database::getConnection();
    $db->beginTransaction();

    // Fetch the request
    $stmt = $db->prepare("SELECT * FROM requests WHERE request_id = :req_id FOR UPDATE");
    $stmt->execute([':req_id' => $requestId]);
    $req = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$req) {
        $db->rollBack();
        Response::notFound('Request record not found.');
    }

    if ($req['status'] === $status) {
        $db->rollBack();
        Response::badRequest("Request is already marked as $status.");
    }

    // Role restrictions for Archive approval (Super Admin only)
    if ($req['type'] === 'archive' && $status === 'approved' && ($user['role'] ?? '') !== 'superadmin') {
        $db->rollBack();
        Response::forbidden('Only the Super Admin has authority to approve book archive requests.');
    }

    // Update request status
    $stmtUpdate = $db->prepare("
        UPDATE requests 
        SET status = :status, approver_id = :approver, approval_date = NOW(), remarks = :remarks 
        WHERE id = :id
    ");
    $stmtUpdate->execute([
        ':status' => $status,
        ':approver' => $user['id'],
        ':remarks' => $remarks ?: "Request $status by " . ($user['first_name'] ?? 'Staff'),
        ':id' => $req['id']
    ]);

    // Handle automated side-effects if approved:
    if ($status === 'approved') {
        if ($req['type'] === 'borrowing' && !empty($req['book_id'])) {
            // Check available copies and create borrow transaction
            $stmtBook = $db->prepare("SELECT id, title, available_copies, status FROM books WHERE id = :bid FOR UPDATE");
            $stmtBook->execute([':bid' => $req['book_id']]);
            $book = $stmtBook->fetch(PDO::FETCH_ASSOC);

            if (!$book || $book['available_copies'] <= 0) {
                $db->rollBack();
                Response::badRequest('Cannot approve borrow request: No available copies remain for this book.');
            }

            // Decrement available copies
            $newAvailable = $book['available_copies'] - 1;
            $newStatus = ($newAvailable <= 0) ? 'unavailable' : 'available';
            $stmtDec = $db->prepare("UPDATE books SET available_copies = :av, status = :st WHERE id = :bid");
            $stmtDec->execute([':av' => $newAvailable, ':st' => $newStatus, ':bid' => $req['book_id']]);

            // Loan duration from settings
            $loanDays = 14;
            try {
                $durSetting = $db->query("SELECT setting_value FROM system_settings WHERE setting_key = 'loan_duration_days'")->fetchColumn();
                if ($durSetting) $loanDays = (int)$durSetting;
            } catch (Exception $e) {}

            $txnId = 'TXN-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -5));
            $dueDate = date('Y-m-d', strtotime("+$loanDays days"));

            // Insert transaction
            $stmtTxn = $db->prepare("
                INSERT INTO transactions (transaction_id, user_id, book_id, borrow_date, due_date, status)
                VALUES (:txn_id, :uid, :bid, CURRENT_DATE, :due_date, 'active')
            ");
            $stmtTxn->execute([
                ':txn_id' => $txnId,
                ':uid' => $req['user_id'],
                ':bid' => $req['book_id'],
                ':due_date' => $dueDate
            ]);

            // Send in-app notification to member
            try {
                $stmtNotif = $db->prepare("
                    INSERT INTO notifications (user_id, title, message, type)
                    VALUES (:uid, 'Borrow Request Approved', :msg, 'announcement')
                ");
                $stmtNotif->execute([
                    ':uid' => $req['user_id'],
                    ':msg' => "Your borrowing request for '{$book['title']}' has been approved! Due date: $dueDate. Transaction ID: $txnId."
                ]);
            } catch (Exception $e) {}

        } elseif ($req['type'] === 'archive' && !empty($req['book_id'])) {
            // Archive the book
            $stmtArch = $db->prepare("UPDATE books SET status = 'archived' WHERE id = :bid");
            $stmtArch->execute([':bid' => $req['book_id']]);
        }
    } elseif ($status === 'rejected') {
        // Send rejection notification
        try {
            $stmtNotif = $db->prepare("
                INSERT INTO notifications (user_id, title, message, type)
                VALUES (:uid, 'Request Update', :msg, 'announcement')
            ");
            $stmtNotif->execute([
                ':uid' => $req['user_id'],
                ':msg' => "Your request ({$req['request_id']}) was reviewed and could not be approved. Remarks: " . ($remarks ?: 'No remarks provided.')
            ]);
        } catch (Exception $e) {}
    }

    $db->commit();

    logActivity(
        $user['id'],
        "request_$status",
        'Requests',
        "Request {$req['request_id']} ({$req['type']}) marked as $status by {$user['first_name']} {$user['last_name']}. Remarks: $remarks"
    );

    Response::success(null, "Request has been successfully marked as $status.");

} catch (PDOException $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    Response::error('Database transaction error: ' . $e->getMessage());
}

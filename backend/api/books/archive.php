<?php
// backend/api/books/archive.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/activity_logger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed. Only POST is supported.', 405);
}

// Admin / Super Admin
$currentUser = JWT::requireRole(['admin', 'superadmin']);
$isSuperAdmin = ($currentUser['role'] ?? '') === 'superadmin';

$input = Utils::getJsonInput();
$id = $input['id'] ?? null;
$reason = trim($input['reason'] ?? '');

if (!$id) {
    Response::badRequest('A valid Book ID is required to process archival.');
}

try {
    $db = Database::getConnection();
    $db->beginTransaction();

    // 1. Fetch book details
    $stmtBook = $db->prepare("SELECT * FROM books WHERE id = :id FOR UPDATE");
    $stmtBook->execute([':id' => $id]);
    $book = $stmtBook->fetch(PDO::FETCH_ASSOC);

    if (!$book) {
        $db->rollBack();
        Response::notFound('The requested book could not be found.');
    }

    $currentStatus = $book['status'];

    if ($currentStatus === 'archived') {
        // Restore book - SUPER ADMIN ONLY
        if (!$isSuperAdmin) {
            $db->rollBack();
            Response::forbidden('Only the Super Admin has authority to directly restore archived books.');
        }

        $newStatus = (int)$book['available_copies'] > 0 ? 'available' : 'unavailable';
        $stmtUpdate = $db->prepare("UPDATE books SET status = :status WHERE id = :id");
        $stmtUpdate->execute([':status' => $newStatus, ':id' => $id]);
        $db->commit();

        logActivity(
            $currentUser['id'],
            'restore_book',
            'Books',
            "Super Admin restored archived book: '{$book['title']}'"
        );

        Response::success(['status' => $newStatus], 'Book record successfully restored to active catalog!');
    } else {
        // Archiving book
        $borrowedCopies = (int)$book['total_copies'] - (int)$book['available_copies'];
        if ($borrowedCopies > 0) {
            $db->rollBack();
            Response::badRequest("Cannot archive this book. Currently, $borrowedCopies copies are on loan.");
        }

        if (!$isSuperAdmin) {
            // Admin creates an archive request for Super Admin approval
            $requestId = 'REQ-ARC-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -5));
            $stmtReq = $db->prepare("
                INSERT INTO requests (request_id, type, user_id, book_id, title, author, reason, status)
                VALUES (:req_id, 'archive', :uid, :bid, :title, :author, :reason, 'pending')
            ");
            $stmtReq->execute([
                ':req_id' => $requestId,
                ':uid' => $currentUser['id'],
                ':bid' => $id,
                ':title' => $book['title'],
                ':author' => $book['author'],
                ':reason' => $reason ?: 'Archival requested by librarian'
            ]);
            $db->commit();

            logActivity(
                $currentUser['id'],
                'archive_request',
                'Requests',
                "Librarian submitted archive request ($requestId) for book '{$book['title']}'"
            );

            Response::success(['request_id' => $requestId], 'Archive request submitted successfully for Super Admin approval.');
        } else {
            // Super Admin directly archives
            $newStatus = 'archived';
            $stmtUpdate = $db->prepare("UPDATE books SET status = :status WHERE id = :id");
            $stmtUpdate->execute([':status' => $newStatus, ':id' => $id]);
            $db->commit();

            logActivity(
                $currentUser['id'],
                'archive_book',
                'Books',
                "Super Admin archived book: '{$book['title']}'"
            );

            Response::success(['status' => $newStatus], 'Book record successfully archived!');
        }
    }

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    Response::error('Failed to update book archival status: ' . $e->getMessage());
}

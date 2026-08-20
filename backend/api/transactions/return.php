<?php
// backend/api/transactions/return.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/middleware.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/activity_logger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed. Only POST is supported.', 405);
}

// Authenticate user
$currentUser = Middleware::requireAuth();

$input = Utils::getJsonInput();

$transactionId = $input['transaction_id'] ?? '';
$id = isset($input['id']) ? (int)$input['id'] : 0;

if (empty($transactionId) && $id <= 0) {
    Response::badRequest('Transaction ID or Primary ID is required to process return.');
}

try {
    $db = Database::getConnection();
    
    // Start Transaction
    $db->beginTransaction();
    
    // 1. Fetch transaction details and lock
    if ($id > 0) {
        $stmtTxn = $db->prepare("SELECT * FROM transactions WHERE id = :id FOR UPDATE");
        $stmtTxn->execute([':id' => $id]);
    } else {
        $stmtTxn = $db->prepare("SELECT * FROM transactions WHERE transaction_id = :txn_id FOR UPDATE");
        $stmtTxn->execute([':txn_id' => $transactionId]);
    }
    
    $txn = $stmtTxn->fetch();
    
    if (!$txn) {
        $db->rollBack();
        Response::notFound('Transaction record not found.');
    }
    
    if ($txn['status'] === 'completed') {
        $db->rollBack();
        Response::badRequest('This book has already been returned.');
    }
    
    // Ensure safety: members can only trigger their own returns unless it is an Admin/Superadmin
    if (!in_array($currentUser['role'] ?? '', ['admin', 'superadmin']) && $txn['user_id'] !== $currentUser['id']) {
        $db->rollBack();
        Response::forbidden('You do not have permission to return this book.');
    }
    
    $bookId = $txn['book_id'];
    $userId = $txn['user_id'];
    
    // 2. Increment book available copies and check for reservations queue
    $stmtBook = $db->prepare("SELECT id, title, available_copies, total_copies FROM books WHERE id = :id FOR UPDATE");
    $stmtBook->execute([':id' => $bookId]);
    $book = $stmtBook->fetch();
    
    if ($book) {
        $newAvailable = min((int)$book['total_copies'], (int)$book['available_copies'] + 1);
        $stmtUpdateBook = $db->prepare("UPDATE books SET available_copies = :available, status = 'available' WHERE id = :id");
        $stmtUpdateBook->execute([
            ':available' => $newAvailable,
            ':id' => $bookId
        ]);

        // Check if there is any pending reservation for this book (First-Come-First-Served queue)
        $stmtPendingRes = $db->prepare("
            SELECT id, user_id FROM reservations 
            WHERE book_id = :book_id AND status = 'pending' 
            ORDER BY reservation_date ASC LIMIT 1
            FOR UPDATE
        ");
        $stmtPendingRes->execute([':book_id' => $bookId]);
        $oldestRes = $stmtPendingRes->fetch();

        if ($oldestRes) {
            // Shift reservation status to 'ready'
            $stmtUpdateRes = $db->prepare("UPDATE reservations SET status = 'ready' WHERE id = :id");
            $stmtUpdateRes->execute([':id' => $oldestRes['id']]);

            // Notify member that the book is ready for borrowing
            $stmtNotifRes = $db->prepare("
                INSERT INTO notifications (user_id, title, message, type)
                VALUES (:user_id, :title, :message, 'reservation_ready')
            ");
            $stmtNotifRes->execute([
                ':user_id' => $oldestRes['user_id'],
                ':title' => 'Reserved Book Ready',
                ':message' => 'The book "' . $book['title'] . '" you reserved is now available! Please borrow it from your dashboard.'
            ]);
        }
    }
    
    // 3. Check for late return and calculate fine
    $returnDate = date('Y-m-d');
    $overdueDays = Utils::calculateOverdueDays($txn['due_date'], $returnDate);
    $fineAmount = Utils::calculateFineAmount($overdueDays);
    
    $fineCreated = false;
    $fineId = '';
    
    if ($overdueDays > 0 && $fineAmount > 0) {
        // Create an unpaid fine
        $fineId = Utils::generateId('FIN');
        $reason = 'Book "' . ($book['title'] ?? 'Catalog Book') . '" returned ' . $overdueDays . ' day(s) late. Due date was ' . date('M d, Y', strtotime($txn['due_date'])) . '.';
        
        $stmtInsertFine = $db->prepare("
            INSERT INTO fines (fine_id, user_id, transaction_id, amount, reason, status)
            VALUES (:fine_id, :user_id, :txn_pk_id, :amount, :reason, 'unpaid')
        ");
        $stmtInsertFine->execute([
            ':fine_id' => $fineId,
            ':user_id' => $userId,
            ':txn_pk_id' => $txn['id'],
            ':amount' => $fineAmount,
            ':reason' => $reason
        ]);
        
        $fineCreated = true;
        
        // Notify member about the fine
        $stmtNotif = $db->prepare("
            INSERT INTO notifications (user_id, title, message, type)
            VALUES (:user_id, :title, :message, 'overdue')
        ");
        $stmtNotif->execute([
            ':user_id' => $userId,
            ':title' => 'Late Return Fine Issued',
            ':message' => 'An overdue fine of ₱' . number_format($fineAmount, 2) . ' was charged for returning "' . ($book['title'] ?? 'book') . '" ' . $overdueDays . ' day(s) late.'
        ]);
    } else {
        // Notify member about successful on-time return
        $stmtNotif = $db->prepare("
            INSERT INTO notifications (user_id, title, message, type)
            VALUES (:user_id, :title, :message, 'announcement')
        ");
        $stmtNotif->execute([
            ':user_id' => $userId,
            ':title' => 'Book Returned Successfully',
            ':message' => 'Thank you! The book "' . ($book['title'] ?? 'book') . '" was returned in good order.'
        ]);
    }
    
    // 4. Update transaction status
    $stmtUpdateTxn = $db->prepare("
        UPDATE transactions 
        SET return_date = :return_date, 
            status = 'completed' 
        WHERE id = :id
    ");
    $stmtUpdateTxn->execute([
        ':return_date' => $returnDate,
        ':id' => $txn['id']
    ]);
    
    // Commit transaction
    $db->commit();
    
    // Log activity
    $isReturningForSelf = $userId === $currentUser['id'];
    $description = $isReturningForSelf 
        ? "Returned book: \"{$book['title']}\" (Transaction ID: {$txn['transaction_id']})"
        : "Returned book \"{$book['title']}\" for user ID: $userId (Transaction ID: {$txn['transaction_id']})";
    
    if ($fineCreated) {
        $description .= " - Late return fine of ₱" . number_format($fineAmount, 2) . " generated";
    }
    
    logActivity(
        $currentUser['id'],
        'returned',
        'Transactions',
        $description,
        null,
        json_encode([
            'transaction_id' => $txn['transaction_id'],
            'book_id' => $bookId,
            'user_id' => $userId,
            'return_date' => $returnDate,
            'overdue_days' => $overdueDays,
            'fine_amount' => $fineAmount,
            'fine_id' => $fineId
        ]),
        $txn['id'],
        'transaction'
    );
    
    Response::success([
        'overdue_days' => $overdueDays,
        'fine_amount' => $fineAmount,
        'fine_id' => $fineId,
        'fine_created' => $fineCreated
    ], $fineCreated 
        ? 'Book returned overdue. Late fine of ₱' . number_format($fineAmount, 2) . ' has been generated.' 
        : 'Book returned successfully on time!'
    );

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    Response::error('Failed to process book return: ' . $e->getMessage());
}

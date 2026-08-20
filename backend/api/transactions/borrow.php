<?php
// backend/api/transactions/borrow.php
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

if (empty($input['book_id'])) {
    Response::badRequest('A valid Book ID is required to borrow.');
}

$bookId = trim($input['book_id']);

// Determine borrowing user: Admin/Superadmin can borrow on behalf of another user
$userId = $currentUser['id'];
if (in_array($currentUser['role'] ?? '', ['admin', 'superadmin']) && !empty($input['user_id'])) {
    $userId = trim($input['user_id']);
}

try {
    $db = Database::getConnection();
    
    // Start Transaction to ensure complete integrity
    $db->beginTransaction();
    
    // 1. Fetch user status and ensure they are active
    $stmtUser = $db->prepare("SELECT status FROM users WHERE id = :id FOR UPDATE");
    $stmtUser->execute([':id' => $userId]);
    $userStatus = $stmtUser->fetchColumn();
    
    if (!$userStatus) {
        $db->rollBack();
        Response::notFound('Borrowing user not found.');
    }
    
    if ($userStatus !== 'active') {
        $db->rollBack();
        Response::forbidden('Cannot borrow. The borrowing member account is inactive.');
    }
    
    // 2. Fetch book details and lock row for update
    $stmtBook = $db->prepare("SELECT title, available_copies, status FROM books WHERE id = :id FOR UPDATE");
    $stmtBook->execute([':id' => $bookId]);
    $book = $stmtBook->fetch();
    
    if (!$book) {
        $db->rollBack();
        Response::notFound('Book not found.');
    }
    
    if ($book['status'] !== 'available' || (int)$book['available_copies'] <= 0) {
        $db->rollBack();
        Response::badRequest('This book is currently out of stock or unavailable for loan.');
    }

    // Reservation Queue Lock Check
    // If there are ready reservations for this book, ensure they are prioritized.
    $stmtReadyRes = $db->prepare("SELECT COUNT(*) FROM reservations WHERE book_id = :book_id AND status = 'ready'");
    $stmtReadyRes->execute([':book_id' => $bookId]);
    $readyCount = (int)$stmtReadyRes->fetchColumn();

    $stmtUserReady = $db->prepare("SELECT id FROM reservations WHERE book_id = :book_id AND user_id = :user_id AND status = 'ready'");
    $stmtUserReady->execute([':book_id' => $bookId, ':user_id' => $userId]);
    $hasUserReady = $stmtUserReady->fetch() ? true : false;

    if ($readyCount > 0 && !$hasUserReady) {
        if ((int)$book['available_copies'] <= $readyCount) {
            $db->rollBack();
            Response::badRequest('This copy is currently held for a member who has a prioritized book reservation.');
        }
    }
    
    // 3. Verify borrowing limits (Max 3 active loans)
    $stmtLimit = $db->prepare("SELECT COUNT(*) FROM transactions WHERE user_id = :user_id AND status IN ('active', 'overdue')");
    $stmtLimit->execute([':user_id' => $userId]);
    $activeLoansCount = (int)$stmtLimit->fetchColumn();
    
    if ($activeLoansCount >= MAX_BORROWED_BOOKS) {
        $db->rollBack();
        Response::badRequest('Borrow limit reached. Members may only have a maximum of ' . MAX_BORROWED_BOOKS . ' active loans concurrently.');
    }
    
    // 4. Verify no unpaid fines
    $stmtFines = $db->prepare("SELECT COUNT(*) FROM fines WHERE user_id = :user_id AND status = 'unpaid'");
    $stmtFines->execute([':user_id' => $userId]);
    $unpaidFinesCount = (int)$stmtFines->fetchColumn();
    
    if ($unpaidFinesCount > 0) {
        $db->rollBack();
        Response::badRequest('Borrowing is blocked. The member currently has outstanding unpaid library fines.');
    }
    
    // 5. Verify no concurrent loan of the exact same book
    $stmtDup = $db->prepare("SELECT COUNT(*) FROM transactions WHERE user_id = :user_id AND book_id = :book_id AND status IN ('active', 'overdue')");
    $stmtDup->execute([
        ':user_id' => $userId,
        ':book_id' => $bookId
    ]);
    if ((int)$stmtDup->fetchColumn() > 0) {
        $db->rollBack();
        Response::badRequest('The member already has an active loan for this book.');
    }
    
    // 6. Deduct book inventory
    $newAvailable = (int)$book['available_copies'] - 1;
    $newStatus = $newAvailable > 0 ? 'available' : 'unavailable';
    
    $stmtUpdateBook = $db->prepare("UPDATE books SET available_copies = :available, status = :status WHERE id = :id");
    $stmtUpdateBook->execute([
        ':available' => $newAvailable,
        ':status' => $newStatus,
        ':id' => $bookId
    ]);
    
    // 7. Register borrow transaction
    $txnId = Utils::generateId('TXN');
    $borrowDate = date('Y-m-d');
    $dueDate = date('Y-m-d', strtotime('+' . BORROW_DURATION_DAYS . ' days'));
    
    $stmtInsertTxn = $db->prepare("
        INSERT INTO transactions (transaction_id, user_id, book_id, borrow_date, due_date, status)
        VALUES (:txn_id, :user_id, :book_id, :borrow_date, :due_date, 'active')
    ");
    $stmtInsertTxn->execute([
        ':txn_id' => $txnId,
        ':user_id' => $userId,
        ':book_id' => $bookId,
        ':borrow_date' => $borrowDate,
        ':due_date' => $dueDate
    ]);

    // 7.5. Mark reservation as completed if it was ready
    if ($hasUserReady) {
        $stmtCompleteRes = $db->prepare("
            UPDATE reservations 
            SET status = 'completed' 
            WHERE book_id = :book_id AND user_id = :user_id AND status = 'ready'
        ");
        $stmtCompleteRes->execute([
            ':book_id' => $bookId,
            ':user_id' => $userId
        ]);
    }
    
    // 8. Create Notification for the member
    $stmtNotif = $db->prepare("
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (:user_id, :title, :message, 'due_reminder')
    ");
    $stmtNotif->execute([
        ':user_id' => $userId,
        ':title' => 'Book Borrowed Successfully',
        ':message' => 'You have borrowed "' . $book['title'] . '". Please return it on or before ' . date('M d, Y', strtotime($dueDate)) . ' to avoid late charges.'
    ]);
    
    // Commit everything
    $db->commit();
    
    // Log activity
    $isBorrowingForSelf = $userId === $currentUser['id'];
    $description = $isBorrowingForSelf 
        ? "Borrowed book: \"{$book['title']}\" (Transaction ID: $txnId)"
        : "Borrowed book \"{$book['title']}\" for user ID: $userId (Transaction ID: $txnId)";
    
    logActivity(
        $currentUser['id'],
        'borrowed',
        'Transactions',
        $description,
        null,
        json_encode([
            'transaction_id' => $txnId,
            'book_id' => $bookId,
            'user_id' => $userId,
            'borrow_date' => $borrowDate,
            'due_date' => $dueDate
        ]),
        $db->lastInsertId(),
        'transaction'
    );
    
    Response::success([
        'transaction_id' => $txnId,
        'due_date' => $dueDate
    ], 'Book successfully checked out!');

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    Response::error('Failed to process borrow loan: ' . $e->getMessage());
}

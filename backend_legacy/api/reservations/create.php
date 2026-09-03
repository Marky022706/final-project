<?php
// backend/api/reservations/create.php
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
$bookId = isset($input['book_id']) ? (int)$input['book_id'] : 0;

if ($bookId <= 0) {
    Response::badRequest('A valid Book ID is required to place a reservation.');
}

try {
    $db = Database::getConnection();
    
    // Start transaction
    $db->beginTransaction();

    // 1. Fetch book details
    $stmtBook = $db->prepare("SELECT id, title, available_copies, status FROM books WHERE id = :id FOR UPDATE");
    $stmtBook->execute([':id' => $bookId]);
    $book = $stmtBook->fetch();

    if (!$book) {
        $db->rollBack();
        Response::notFound('The requested book does not exist.');
    }

    if ($book['status'] === 'archived') {
        $db->rollBack();
        Response::badRequest('This book has been archived and is not available for reservations.');
    }

    // A book can only be reserved if it is out of stock / unavailable
    $isOutOfStock = (int)$book['available_copies'] <= 0 || $book['status'] === 'unavailable';
    if (!$isOutOfStock) {
        $db->rollBack();
        Response::badRequest('This book currently has available copies. Please borrow it directly.');
    }

    // 2. Check if the user already has a pending or ready reservation for this book
    $stmtCheck = $db->prepare("
        SELECT id FROM reservations 
        WHERE user_id = :user_id AND book_id = :book_id AND status IN ('pending', 'ready')
    ");
    $stmtCheck->execute([
        ':user_id' => $currentUser['id'],
        ':book_id' => $bookId
    ]);
    if ($stmtCheck->fetch()) {
        $db->rollBack();
        Response::badRequest('You already have an active reservation for this book.');
    }

    // 3. Create reservation record
    $reservationId = Utils::generateId('RES');
    $stmtInsert = $db->prepare("
        INSERT INTO reservations (reservation_id, user_id, book_id, status)
        VALUES (:reservation_id, :user_id, :book_id, 'pending')
    ");
    $stmtInsert->execute([
        ':reservation_id' => $reservationId,
        ':user_id' => $currentUser['id'],
        ':book_id' => $bookId
    ]);

    // Send an account notification to the user about their successful reservation
    $stmtNotif = $db->prepare("
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (:user_id, :title, :message, 'announcement')
    ");
    $stmtNotif->execute([
        ':user_id' => $currentUser['id'],
        ':title' => 'Book Reservation Placed',
        ':message' => 'Your reservation for "' . $book['title'] . '" was successfully placed. You will be notified once it is ready for collection.'
    ]);

    // Commit transaction
    $db->commit();

    // Log reservation creation
    logActivity(
        $currentUser['id'],
        'reserved',
        'Reservations',
        "Reserved book: \"{$book['title']}\" (Reservation ID: $reservationId)"
    );

    Response::success([
        'reservation_id' => $reservationId,
        'title' => $book['title']
    ], 'Book reservation successfully placed in queue!');

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    Response::error('Failed to create book reservation: ' . $e->getMessage());
}

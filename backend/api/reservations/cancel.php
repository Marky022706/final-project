<?php
// backend/api/reservations/cancel.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/middleware.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/activity_logger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    Response::error('Method not allowed. Only POST/DELETE is supported.', 405);
}

// Authenticate user
$currentUser = Middleware::requireAuth();

$input = Utils::getJsonInput();
$id = isset($input['id']) ? (int)$input['id'] : (isset($_GET['id']) ? (int)$_GET['id'] : 0);

if ($id <= 0) {
    Response::badRequest('A valid Reservation ID is required for cancellation.');
}

try {
    $db = Database::getConnection();
    
    // Start transaction
    $db->beginTransaction();

    // 1. Fetch reservation and book details for logging
    $stmtFetch = $db->prepare("
        SELECT r.*, b.title 
        FROM reservations r 
        JOIN books b ON r.book_id = b.id 
        WHERE r.id = :id FOR UPDATE
    ");
    $stmtFetch->execute([':id' => $id]);
    $res = $stmtFetch->fetch();

    if (!$res) {
        $db->rollBack();
        Response::notFound('Reservation record not found.');
    }

    if ($res['status'] === 'cancelled' || $res['status'] === 'completed') {
        $db->rollBack();
        Response::badRequest('This reservation is already finalized and cannot be cancelled.');
    }

    // 2. Safety guard: members can only cancel their own reservations
    if (!in_array($currentUser['role'] ?? '', ['admin', 'superadmin']) && $res['user_id'] !== $currentUser['id']) {
        $db->rollBack();
        Response::forbidden('You do not have permission to cancel this reservation.');
    }

    // 3. Mark reservation as cancelled
    $stmtCancel = $db->prepare("UPDATE reservations SET status = 'cancelled' WHERE id = :id");
    $stmtCancel->execute([':id' => $id]);

    // Send a notification of cancellation
    $stmtNotif = $db->prepare("
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (:user_id, :title, :message, 'announcement')
    ");
    $stmtNotif->execute([
        ':user_id' => $res['user_id'],
        ':title' => 'Book Reservation Cancelled',
        ':message' => 'Your book reservation record has been successfully cancelled.'
    ]);

    // Commit transaction
    $db->commit();

    // Log reservation cancellation
    $isSelfCancellation = $res['user_id'] === $currentUser['id'];
    $description = $isSelfCancellation 
        ? "Cancelled own reservation for \"{$res['title']}\" (Reservation ID: {$res['reservation_id']})"
        : "Cancelled reservation for \"{$res['title']}\" by user ID: {$res['user_id']} (Reservation ID: {$res['reservation_id']})";
    
    logActivity(
        $currentUser['id'],
        'cancelled',
        'Reservations',
        $description
    );

    Response::success(null, 'Book reservation cancelled successfully.');

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    Response::error('Failed to cancel reservation: ' . $e->getMessage());
}

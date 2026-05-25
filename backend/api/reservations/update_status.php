<?php
// backend/api/reservations/update_status.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/middleware.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed. Only POST is supported.', 405);
}

// Authenticate admin
$currentUser = Middleware::requireAuth();
if ($currentUser['role'] !== 'admin') {
    Response::error('Access denied. Only administrators can update reservation statuses.', 403);
}

$input = Utils::getJsonInput();
$reservationId = isset($input['reservation_id']) ? (int)$input['reservation_id'] : 0;
$newStatus = isset($input['status']) ? trim($input['status']) : '';

if ($reservationId <= 0) {
    Response::badRequest('A valid Reservation ID is required.');
}

$allowedStatuses = ['pending', 'ready', 'completed', 'cancelled'];
if (!in_array($newStatus, $allowedStatuses)) {
    Response::badRequest('Invalid status. Allowed values: ' . implode(', ', $allowedStatuses));
}

try {
    $db = Database::getConnection();
    $db->beginTransaction();

    // Fetch current reservation with lock
    $stmtRes = $db->prepare("
        SELECT r.*, b.title AS book_title, b.available_copies
        FROM reservations r
        JOIN books b ON r.book_id = b.id
        WHERE r.id = :id
        FOR UPDATE
    ");
    $stmtRes->execute([':id' => $reservationId]);
    $reservation = $stmtRes->fetch();

    if (!$reservation) {
        $db->rollBack();
        Response::notFound('Reservation not found.');
    }

    $currentStatus = $reservation['status'];

    // Validate status transitions
    $validTransitions = [
        'pending'   => ['ready', 'cancelled'],
        'ready'     => ['completed', 'cancelled'],
        'completed' => [],
        'cancelled' => []
    ];

    if (!in_array($newStatus, $validTransitions[$currentStatus] ?? [])) {
        $db->rollBack();
        Response::badRequest("Cannot transition from '{$currentStatus}' to '{$newStatus}'.");
    }

    // Update the reservation status
    $stmtUpdate = $db->prepare("UPDATE reservations SET status = :status WHERE id = :id");
    $stmtUpdate->execute([
        ':status' => $newStatus,
        ':id' => $reservationId
    ]);

    // If marking as 'ready', send a notification to the member
    if ($newStatus === 'ready') {
        $stmtNotif = $db->prepare("
            INSERT INTO notifications (user_id, title, message, type)
            VALUES (:user_id, :title, :message, 'reservation_ready')
        ");
        $stmtNotif->execute([
            ':user_id' => $reservation['user_id'],
            ':title'   => 'Reservation Ready for Collection!',
            ':message'  => 'Great news! Your reserved book "' . $reservation['book_title'] . '" is now available for collection at the Balingasag Municipal Library. Please pick it up within 3 days to avoid cancellation.'
        ]);

        // Mark as notified
        $stmtNotified = $db->prepare("UPDATE reservations SET notified = TRUE WHERE id = :id");
        $stmtNotified->execute([':id' => $reservationId]);
    }

    $db->commit();

    Response::success([
        'reservation_id' => $reservation['reservation_id'],
        'old_status' => $currentStatus,
        'new_status' => $newStatus
    ], "Reservation status updated to '{$newStatus}' successfully.");

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    Response::error('Failed to update reservation status: ' . $e->getMessage());
}

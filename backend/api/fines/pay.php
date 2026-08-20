<?php
// backend/api/fines/pay.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/middleware.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/activity_logger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed. Only POST is supported.', 405);
}

// Admin Route Guard
$currentUser = Middleware::requireAdmin();

$input = Utils::getJsonInput();

$fineId = $input['fine_id'] ?? '';
$id = isset($input['id']) ? (int)$input['id'] : 0;
$action = $input['action'] ?? 'pay'; // 'pay' or 'waive'

if (empty($fineId) && $id <= 0) {
    Response::badRequest('Fine ID or Primary ID is required to process payment.');
}

if (!in_array($action, ['pay', 'waive'])) {
    Response::badRequest('Invalid action. Supported values are: pay, waive.');
}

try {
    $db = Database::getConnection();
    
    // Start Transaction
    $db->beginTransaction();
    
    // Fetch fine details
    if ($id > 0) {
        $stmtFine = $db->prepare("SELECT * FROM fines WHERE id = :id FOR UPDATE");
        $stmtFine->execute([':id' => $id]);
    } else {
        $stmtFine = $db->prepare("SELECT * FROM fines WHERE fine_id = :fine_id FOR UPDATE");
        $stmtFine->execute([':fine_id' => $fineId]);
    }
    
    $fine = $stmtFine->fetch();
    
    if (!$fine) {
        $db->rollBack();
        Response::notFound('Fine record not found.');
    }
    
    if ($fine['status'] !== 'unpaid') {
        $db->rollBack();
        Response::badRequest('This fine is already settled (status: ' . $fine['status'] . ').');
    }
    
    $newStatus = ($action === 'waived' || $action === 'waive') ? 'waived' : 'paid';
    $paidDate = date('Y-m-d');
    
    // 1. Update Fine status
    $stmtUpdate = $db->prepare("UPDATE fines SET status = :status, paid_date = :paid_date WHERE id = :id");
    $stmtUpdate->execute([
        ':status' => $newStatus,
        ':paid_date' => $paidDate,
        ':id' => $fine['id']
    ]);
    
    // 2. Create user notification
    $title = $newStatus === 'paid' ? 'Fine Payment Confirmed' : 'Fine Waived';
    $message = $newStatus === 'paid' 
        ? 'Your payment of ₱' . number_format($fine['amount'], 2) . ' for fine card ' . $fine['fine_id'] . ' has been recorded. Thank you!'
        : 'Your library fine of ₱' . number_format($fine['amount'], 2) . ' (' . $fine['fine_id'] . ') has been waived by the library administrator.';
        
    $stmtNotif = $db->prepare("
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (:user_id, :title, :message, 'announcement')
    ");
    $stmtNotif->execute([
        ':user_id' => $fine['user_id'],
        ':title' => $title,
        ':message' => $message
    ]);
    
    // Commit transaction
    $db->commit();
    
    // Log fine payment/waiver
    $actionText = $newStatus === 'paid' ? 'paid' : 'waived';
    $description = "Fine {$actionText}: ₱" . number_format($fine['amount'], 2) . " (Fine ID: {$fine['fine_id']}) for user ID: {$fine['user_id']}";
    
    logActivity(
        $currentUser['id'],
        $newStatus === 'paid' ? 'paid' : 'waived',
        'Fines',
        $description
    );
    
    Response::success(null, $newStatus === 'paid' 
        ? 'Fine successfully recorded as Paid!' 
        : 'Fine successfully Waived!'
    );

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    Response::error('Failed to process fine payment: ' . $e->getMessage());
}

<?php
// backend/api/auth/logout.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/activity_logger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed. Only POST is supported.', 405);
}

$input = Utils::getJsonInput();
$refreshToken = $input['refreshToken'] ?? '';

if (empty($refreshToken)) {
    Response::badRequest('Refresh token is required to log out.');
}

try {
    $db = Database::getConnection();
    
    // Hash the incoming token
    $tokenHash = hash('sha256', $refreshToken);
    
    // Get user ID from refresh token before deletion
    $stmtUser = $db->prepare("SELECT user_id FROM refresh_tokens WHERE token_hash = :token_hash");
    $stmtUser->execute([':token_hash' => $tokenHash]);
    $tokenData = $stmtUser->fetch();
    
    // Delete the refresh token from the database
    $stmt = $db->prepare("DELETE FROM refresh_tokens WHERE token_hash = :token_hash");
    $stmt->execute([':token_hash' => $tokenHash]);
    
    // Log logout if we have user ID
    if ($tokenData) {
        logActivity(
            $tokenData['user_id'],
            'logout',
            'Authentication',
            "User logged out successfully"
        );
    }
    
    Response::success(null, 'Logged out successfully. Session invalidated.');

} catch (PDOException $e) {
    Response::error('Server database error: ' . $e->getMessage());
}

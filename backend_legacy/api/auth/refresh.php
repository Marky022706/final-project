<?php
// backend/api/auth/refresh.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed. Only POST is supported.', 405);
}

$input = Utils::getJsonInput();
$refreshToken = $input['refreshToken'] ?? '';

if (empty($refreshToken)) {
    Response::badRequest('Refresh token is required.');
}

// 1. Verify the signature and expiry of the refresh token
$payload = JWT::verifyRefresh($refreshToken);
if (!$payload || !isset($payload['id'])) {
    Response::unauthorized('Invalid or expired refresh token.');
}

$userId = $payload['id'];
$tokenHash = hash('sha256', $refreshToken);

try {
    $db = Database::getConnection();
    
    // 2. Check if this refresh token exists in the database
    $stmtCheck = $db->prepare("SELECT id FROM refresh_tokens WHERE token_hash = :token_hash");
    $stmtCheck->execute([':token_hash' => $tokenHash]);
    $tokenExists = $stmtCheck->fetch();
    
    if (!$tokenExists) {
        // REUSE ATTACK DETECTED! 
        // This token is valid structurally but is not in our database. It must have been used before.
        // As a security guard, we immediately revoke all active sessions for this user.
        $stmtRevokeAll = $db->prepare("DELETE FROM refresh_tokens WHERE user_id = :user_id");
        $stmtRevokeAll->execute([':user_id' => $userId]);
        
        Response::error('Security Alert: A compromised session was detected. All sessions have been revoked. Please log in again.', 401);
    }
    
    // 3. Token is valid and exists. We must rotate it!
    // Delete the old refresh token
    $stmtDelete = $db->prepare("DELETE FROM refresh_tokens WHERE token_hash = :token_hash");
    $stmtDelete->execute([':token_hash' => $tokenHash]);
    
    // Fetch current user details to make sure they are still active and exist
    $stmtUser = $db->prepare("SELECT * FROM users WHERE id = :id");
    $stmtUser->execute([':id' => $userId]);
    $user = $stmtUser->fetch();
    
    if (!$user) {
        Response::unauthorized('User account no longer exists.');
    }
    
    if ($user['status'] !== 'active') {
        Response::forbidden('User account is currently inactive.');
    }
    
    // 4. Generate new pair of tokens
    $userPayload = [
        'id' => $user['id'],
        'first_name' => $user['first_name'],
        'last_name' => $user['last_name'],
        'email' => $user['email'],
        'role' => $user['role']
    ];
    
    $newAccessToken = JWT::generateAccess($userPayload);
    $newRefreshToken = JWT::generateRefresh(['id' => $user['id']]);
    
    // 5. Store the new refresh token in the database
    $newTokenHash = hash('sha256', $newRefreshToken);
    $expiresAt = date('Y-m-d H:i:s', time() + JWT_REFRESH_EXPIRY);
    
    $stmtInsertToken = $db->prepare("INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (:user_id, :token_hash, :expires_at)");
    $stmtInsertToken->execute([
        ':user_id' => $user['id'],
        ':token_hash' => $newTokenHash,
        ':expires_at' => $expiresAt
    ]);
    
    // Send both tokens
    Response::success([
        'accessToken' => $newAccessToken,
        'refreshToken' => $newRefreshToken
    ], 'Session refreshed successfully via secure rotation.');

} catch (PDOException $e) {
    Response::error('Server database error: ' . $e->getMessage());
}

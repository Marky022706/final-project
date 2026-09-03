<?php
// backend/api/auth/reset-password.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/activity_logger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed. Only POST is supported.', 405);
}

$input = Utils::getJsonInput();

$missing = Utils::checkRequired(['phone', 'code', 'password'], $input);
if (!empty($missing)) {
    Response::badRequest('Missing required fields: ' . implode(', ', $missing));
}

$phone = preg_replace('/\s+/', '', $input['phone']);
$code = trim($input['code']);
$password = $input['password'];

if (!preg_match('/^\d{6}$/', $code)) {
    Response::badRequest('Reset code must be 6 digits.');
}

if (strlen($password) < 6) {
    Response::badRequest('Password must be at least 6 characters long.');
}

try {
    $db = Database::getConnection();

    $stmt = $db->prepare("
        SELECT prc.id AS reset_id, prc.code_hash, prc.expires_at, u.id AS user_id
        FROM password_reset_codes prc
        INNER JOIN users u ON u.id = prc.user_id
        WHERE prc.phone = :phone
          AND prc.used_at IS NULL
          AND prc.expires_at > NOW()
          AND u.status = 'active'
        ORDER BY prc.created_at DESC
        LIMIT 1
    ");
    $stmt->execute([':phone' => $phone]);
    $reset = $stmt->fetch();

    if (!$reset || !password_verify($code, $reset['code_hash'])) {
        Response::badRequest('Invalid or expired reset code.');
    }

    $db->beginTransaction();

    $stmtUpdateUser = $db->prepare("UPDATE users SET password_hash = :password_hash WHERE id = :user_id");
    $stmtUpdateUser->execute([
        ':password_hash' => password_hash($password, PASSWORD_DEFAULT),
        ':user_id' => $reset['user_id'],
    ]);

    $stmtMarkUsed = $db->prepare("UPDATE password_reset_codes SET used_at = NOW() WHERE id = :reset_id");
    $stmtMarkUsed->execute([':reset_id' => $reset['reset_id']]);

    $stmtRevokeTokens = $db->prepare("DELETE FROM refresh_tokens WHERE user_id = :user_id");
    $stmtRevokeTokens->execute([':user_id' => $reset['user_id']]);

    $db->commit();

    // Log password reset
    logActivity(
        $reset['user_id'],
        'password_reset',
        'Authentication',
        "Password reset successfully via phone verification"
    );

    Response::success(null, 'Password reset successfully. You can now sign in.');

} catch (PDOException $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    Response::error('Server database error: ' . $e->getMessage());
}

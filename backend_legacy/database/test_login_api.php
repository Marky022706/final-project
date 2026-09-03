<?php
// backend/database/test_login_api.php
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';

try {
    $db = Database::getConnection();
    
    // Simulate login for superadmin
    $stmt = $db->prepare("SELECT * FROM users WHERE email = 'superadmin@balingasag.gov.ph'");
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        throw new Exception("Superadmin user not found");
    }

    $accessToken = JWT::generateAccess([
        'id' => $user['id'],
        'email' => $user['email'],
        'role' => $user['role'],
        'first_name' => $user['first_name'],
        'last_name' => $user['last_name']
    ]);
    $refreshToken = JWT::generateRefresh(['id' => $user['id']]);

    $tokenHash = hash('sha256', $refreshToken);
    $expiresAt = date('Y-m-d H:i:s', time() + JWT_REFRESH_EXPIRY);

    $stmtInsert = $db->prepare("INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (:uid, :th, :exp)");
    $stmtInsert->execute([
        ':uid' => $user['id'],
        ':th' => $tokenHash,
        ':exp' => $expiresAt
    ]);

    echo "✅ Login API simulation successful! Token generated & refresh_token saved for {$user['email']}.\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

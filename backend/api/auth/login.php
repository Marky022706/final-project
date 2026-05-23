<?php
// backend/api/auth/login.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed. Only POST is supported.', 405);
}

$input = Utils::getJsonInput();

$required = ['email', 'password'];
$missing = Utils::checkRequired($required, $input);

if (!empty($missing)) {
    Response::badRequest('Missing required fields: ' . implode(', ', $missing));
}

$email = filter_var($input['email'], FILTER_VALIDATE_EMAIL);
$password = $input['password'];

if (!$email) {
    Response::badRequest('Invalid email address format.');
}

try {
    $db = Database::getConnection();
    
    // Retrieve user details
    $stmt = $db->prepare("SELECT * FROM users WHERE email = :email");
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($password, $user['password_hash'])) {
        Response::error('Invalid email or password.', 401);
    }
    
    if ($user['status'] !== 'active') {
        Response::forbidden('Your account is currently inactive. Please contact the administrator.');
    }
    
    // Prepare token payload
    $userPayload = [
        'id' => (int)$user['id'],
        'first_name' => $user['first_name'],
        'middle_name' => $user['middle_name'],
        'last_name' => $user['last_name'],
        'email' => $user['email'],
        'role' => $user['role']
    ];
    
    // Generate Tokens
    $accessToken = JWT::generateAccess($userPayload);
    $refreshToken = JWT::generateRefresh(['id' => (int)$user['id']]);
    
    // Store hashed refresh token in database (for rotation & revocation)
    $tokenHash = hash('sha256', $refreshToken);
    $expiresAt = date('Y-m-d H:i:s', time() + JWT_REFRESH_EXPIRY);
    
    $stmtInsertToken = $db->prepare("INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (:user_id, :token_hash, :expires_at)");
    $stmtInsertToken->execute([
        ':user_id' => $user['id'],
        ':token_hash' => $tokenHash,
        ':expires_at' => $expiresAt
    ]);

    // Send payload
    Response::success([
        'accessToken' => $accessToken,
        'refreshToken' => $refreshToken,
        'user' => [
            'id' => (int)$user['id'],
            'first_name' => $user['first_name'],
            'middle_name' => $user['middle_name'],
            'last_name' => $user['last_name'],
            'email' => $user['email'],
            'role' => $user['role'],
            'phone' => $user['phone'],
            'address' => $user['address'],
            'member_since' => $user['member_since']
        ]
    ], 'Authentication successful!');

} catch (PDOException $e) {
    Response::error('Server database error: ' . $e->getMessage());
}

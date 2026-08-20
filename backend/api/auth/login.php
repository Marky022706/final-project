<?php
// backend/api/auth/login.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/activity_logger.php';

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
        // Log failed login attempt
        if ($user) {
            logActivity(
                $user['id'],
                'failed_login',
                'Authentication',
                "Failed login attempt for account: {$user['email']}"
            );
        }
        
        // Also log to system_logs for Super Admin
        try {
            $stmtLog = $db->prepare("INSERT INTO system_logs (log_type, severity, message, ip_address, user_agent) VALUES ('auth_failure', 'warning', :msg, :ip, :ua)");
            $stmtLog->execute([
                ':msg' => "Failed authentication attempt for email: $email",
                ':ip' => $_SERVER['REMOTE_ADDR'] ?? null,
                ':ua' => $_SERVER['HTTP_USER_AGENT'] ?? null
            ]);
        } catch (Exception $ignored) {}

        Response::error('Invalid email or password.', 401);
    }
    
    // Check account status
    if ($user['status'] === 'pending') {
        Response::forbidden('Your account registration is still pending approval by the library administrator. Please allow up to 24 hours or visit the municipal library.');
    }
    if ($user['status'] === 'suspended') {
        Response::forbidden('Your library account has been suspended due to overdue violations or municipal policy. Please contact library staff.');
    }
    if ($user['status'] === 'deactivated' || $user['status'] === 'inactive') {
        Response::forbidden('Your account is currently inactive. Please contact the administrator.');
    }
    if (!empty($user['deleted_at'])) {
        Response::forbidden('Your account has been deleted. Please register for a new library card.');
    }
    
    // Prepare token payload
    $userPayload = [
        'id' => $user['id'],
        'first_name' => $user['first_name'],
        'middle_name' => $user['middle_name'],
        'last_name' => $user['last_name'],
        'email' => $user['email'],
        'role' => $user['role']
    ];
    
    // Generate Tokens
    $accessToken = JWT::generateAccess($userPayload);
    $refreshToken = JWT::generateRefresh(['id' => $user['id']]);
    
    // Store hashed refresh token in database (for rotation & revocation)
    $tokenHash = hash('sha256', $refreshToken);
    $expiresAt = date('Y-m-d H:i:s', time() + JWT_REFRESH_EXPIRY);
    
    $stmtInsertToken = $db->prepare("INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (:user_id, :token_hash, :expires_at)");
    $stmtInsertToken->execute([
        ':user_id' => $user['id'],
        ':token_hash' => $tokenHash,
        ':expires_at' => $expiresAt
    ]);

    // Log successful login
    logActivity(
        $user['id'],
        'login',
        'Authentication',
        "User logged in successfully: {$user['email']} ({$user['role']})"
    );

    // Send payload
    Response::success([
        'accessToken' => $accessToken,
        'refreshToken' => $refreshToken,
        'user' => [
            'id' => $user['id'],
            'first_name' => $user['first_name'],
            'middle_name' => $user['middle_name'],
            'last_name' => $user['last_name'],
            'email' => $user['email'],
            'role' => $user['role'],
            'phone' => $user['phone'],
            'address' => $user['address'],
            'status' => $user['status'],
            'member_since' => $user['member_since'],
            'qr_code' => $user['qr_code']
        ]
    ], 'Login successful.');

} catch (PDOException $e) {
    Response::error('Server database error: ' . $e->getMessage());
}

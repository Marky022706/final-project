<?php
// backend/api/auth/register.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/activity_logger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed. Only POST is supported.', 405);
}

$input = Utils::getJsonInput();

$required = ['first_name', 'last_name', 'email', 'password'];
$missing = Utils::checkRequired($required, $input);

if (!empty($missing)) {
    Response::badRequest('Missing required fields: ' . implode(', ', $missing));
}

$firstName = $input['first_name'];
$middleName = $input['middle_name'] ?? null;
$lastName = $input['last_name'];
$email = filter_var($input['email'], FILTER_VALIDATE_EMAIL);
$password = $input['password'];
$phone = $input['phone'] ?? null;
$address = $input['address'] ?? null;
$role = $input['role'] ?? 'member';
$adminPassword = $input['admin_password'] ?? null;

if (!$email) {
    Response::badRequest('Please provide a valid email address.');
}

if (strlen($password) < 6) {
    Response::badRequest('Password must be at least 6 characters long.');
}

$status = 'pending'; // SRS: New member accounts must start in pending approval state

if ($role === 'admin') {
    if ($adminPassword !== ADMIN_REGISTRATION_PASSWORD) {
        Response::forbidden('Invalid Admin registration passcode.');
    }
    $status = 'active';
} else {
    $role = 'member';
}

try {
    $db = Database::getConnection();
    
    // Check if email already registered
    $stmtCheck = $db->prepare("SELECT id FROM users WHERE email = :email");
    $stmtCheck->execute([':email' => $email]);
    if ($stmtCheck->fetch()) {
        Response::badRequest('This email is already registered.');
    }
    
    // Generate unique QR code for the user
    $qrCode = 'LIB-' . strtoupper(bin2hex(random_bytes(8)));
    
    // Insert new user
    $stmtInsert = $db->prepare("INSERT INTO users (first_name, middle_name, last_name, email, password_hash, role, phone, address, status, member_since, qr_code) 
        VALUES (:first_name, :middle_name, :last_name, :email, :password_hash, :role, :phone, :address, :status, CURRENT_DATE, :qr_code)");
    
    $stmtInsert->execute([
        ':first_name' => $firstName,
        ':middle_name' => $middleName,
        ':last_name' => $lastName,
        ':email' => $email,
        ':password_hash' => password_hash($password, PASSWORD_DEFAULT),
        ':role' => $role,
        ':phone' => $phone,
        ':address' => $address,
        ':status' => $status,
        ':qr_code' => $qrCode
    ]);

    $newUserId = (int)$db->lastInsertId();
    
    // Log new member registration
    logActivity(
        $newUserId,
        'registered',
        'Members',
        "New member registration submitted: $firstName $lastName ($email) - Status: $status"
    );

    if ($status === 'pending') {
        Response::created(null, 'Registration submitted successfully! Your account is pending approval by the library administrator before you can sign in.');
    } else {
        Response::created(null, 'Account created successfully! You can now log in.');
    }

} catch (PDOException $e) {
    Response::error('Server database error: ' . $e->getMessage());
}

<?php
// backend/api/auth/register.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';

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
$lastName = $input['last_name'];
$email = filter_var($input['email'], FILTER_VALIDATE_EMAIL);
$password = $input['password'];
$phone = $input['phone'] ?? null;
$address = $input['address'] ?? null;

if (!$email) {
    Response::badRequest('Please provide a valid email address.');
}

if (strlen($password) < 6) {
    Response::badRequest('Password must be at least 6 characters long.');
}

try {
    $db = Database::getConnection();
    
    // Check if email already registered
    $stmtCheck = $db->prepare("SELECT id FROM users WHERE email = :email");
    $stmtCheck->execute([':email' => $email]);
    if ($stmtCheck->fetch()) {
        Response::badRequest('This email is already registered.');
    }
    
    // Insert new user as member
    $stmtInsert = $db->prepare("INSERT INTO users (first_name, last_name, email, password_hash, role, phone, address, status, member_since) 
        VALUES (:first_name, :last_name, :email, :password_hash, 'member', :phone, :address, 'active', CURRENT_DATE)");
    
    $stmtInsert->execute([
        ':first_name' => $firstName,
        ':last_name' => $lastName,
        ':email' => $email,
        ':password_hash' => password_hash($password, PASSWORD_DEFAULT),
        ':phone' => $phone,
        ':address' => $address
    ]);

    Response::created(null, 'Account created successfully! You can now log in.');

} catch (PDOException $e) {
    Response::error('Server database error: ' . $e->getMessage());
}

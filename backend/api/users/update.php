<?php
// backend/api/users/update.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/middleware.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed. Only PUT/POST is supported.', 405);
}

// Authenticate user
$currentUser = Middleware::requireAuth();

$input = Utils::getJsonInput();

// Default to editing self
$userId = isset($input['id']) ? (int)$input['id'] : $currentUser['id'];

// Access Control check
if ($currentUser['role'] !== 'admin' && $userId !== $currentUser['id']) {
    Response::forbidden('You do not have permission to update this user profile.');
}

$firstName = $input['first_name'] ?? null;
$middleName = $input['middle_name'] ?? null;
$lastName = $input['last_name'] ?? null;
$phone = $input['phone'] ?? null;
$address = $input['address'] ?? null;
$role = $input['role'] ?? null;
$status = $input['status'] ?? null;
$email = $input['email'] ?? null;
$password = $input['password'] ?? null;

try {
    $db = Database::getConnection();
    
    // Fetch old profile details
    $stmtFetch = $db->prepare("SELECT * FROM users WHERE id = :id");
    $stmtFetch->execute([':id' => $userId]);
    $user = $stmtFetch->fetch();
    
    if (!$user) {
        Response::notFound('User profile to update does not exist.');
    }
    
    // Strict Guard: Non-admins CANNOT change status or role!
    if ($currentUser['role'] !== 'admin') {
        $role = $user['role'];      // Revert to old value
        $status = $user['status'];  // Revert to old value
    } else {
        // Admins can adjust status and role, but ensure valid enum values
        if ($role !== null && !in_array($role, ['member', 'admin'])) {
            Response::badRequest('Invalid role value. Must be either admin or member.');
        }
        if ($status !== null && !in_array($status, ['active', 'inactive'])) {
            Response::badRequest('Invalid status value. Must be either active or inactive.');
        }
    }

    // Email Uniqueness Check
    if ($email !== null && $email !== $user['email']) {
        $stmtCheck = $db->prepare("SELECT id FROM users WHERE email = :email AND id != :id");
        $stmtCheck->execute([':email' => $email, ':id' => $userId]);
        if ($stmtCheck->fetch()) {
            Response::badRequest('This email address is already taken by another library cardholder.');
        }
    }
    
    // Apply update (dynamically include password_hash if updating password)
    $sql = "
        UPDATE users 
        SET first_name = :first_name,
            middle_name = :middle_name,
            last_name = :last_name,
            phone = :phone,
            address = :address,
            role = :role,
            status = :status,
            email = :email
    ";
    
    $params = [
        ':first_name' => $firstName ?? $user['first_name'],
        ':middle_name' => $middleName ?? $user['middle_name'],
        ':last_name' => $lastName ?? $user['last_name'],
        ':phone' => $phone ?? $user['phone'],
        ':address' => $address ?? $user['address'],
        ':role' => $role ?? $user['role'],
        ':status' => $status ?? $user['status'],
        ':email' => $email ?? $user['email'],
        ':id' => $userId
    ];

    if (!empty($password)) {
        $sql .= ", password_hash = :password_hash";
        $params[':password_hash'] = password_hash($password, PASSWORD_BCRYPT);
    }

    $sql .= " WHERE id = :id";
    
    $stmtUpdate = $db->prepare($sql);
    $stmtUpdate->execute($params);
    
    Response::success(null, 'User profile updated successfully.');

} catch (PDOException $e) {
    Response::error('Server database error: ' . $e->getMessage());
}

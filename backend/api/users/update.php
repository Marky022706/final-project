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
    
    // Apply update
    $stmtUpdate = $db->prepare("
        UPDATE users 
        SET first_name = :first_name,
            middle_name = :middle_name,
            last_name = :last_name,
            phone = :phone,
            address = :address,
            role = :role,
            status = :status
        WHERE id = :id
    ");
    
    $stmtUpdate->execute([
        ':first_name' => $firstName ?? $user['first_name'],
        ':middle_name' => $middleName ?? $user['middle_name'],
        ':last_name' => $lastName ?? $user['last_name'],
        ':phone' => $phone ?? $user['phone'],
        ':address' => $address ?? $user['address'],
        ':role' => $role ?? $user['role'],
        ':status' => $status ?? $user['status'],
        ':id' => $userId
    ]);
    
    Response::success(null, 'User profile updated successfully.');

} catch (PDOException $e) {
    Response::error('Server database error: ' . $e->getMessage());
}

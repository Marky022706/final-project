<?php
// backend/api/users/update.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/activity_logger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed. Only PUT/POST is supported.', 405);
}

// Authenticate user
$currentUser = JWT::requireAuth();
$input = Utils::getJsonInput();

$userId = isset($input['id']) ? $input['id'] : $currentUser['id'];

$isStaff = in_array($currentUser['role'] ?? '', ['admin', 'superadmin']);
$isSuperAdmin = ($currentUser['role'] ?? '') === 'superadmin';

// Access Control check
if (!$isStaff && $userId !== $currentUser['id']) {
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
$softDelete = $input['soft_delete'] ?? false;

try {
    $db = Database::getConnection();
    
    // Fetch old profile details
    $stmtFetch = $db->prepare("SELECT * FROM users WHERE id = :id");
    $stmtFetch->execute([':id' => $userId]);
    $user = $stmtFetch->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        Response::notFound('User profile does not exist.');
    }

    if ($softDelete) {
        if (!$isSuperAdmin) {
            Response::forbidden('Only the Super Admin can delete user accounts.');
        }
        $stmtDel = $db->prepare("UPDATE users SET deleted_at = NOW(), status = 'deactivated' WHERE id = :id");
        $stmtDel->execute([':id' => $userId]);

        logActivity(
            $currentUser['id'],
            'delete_user',
            'UserManagement',
            "Moved user {$user['email']} to Recycle Bin."
        );
        Response::success(null, 'User account moved to Recycle Bin.');
    }
    
    // Strict Guard: Non-staff CANNOT change status or role
    if (!$isStaff) {
        $role = $user['role'];
        $status = $user['status'];
    } else {
        // Only Super Admin can assign superadmin role
        if ($role === 'superadmin' && !$isSuperAdmin) {
            Response::forbidden('Only the Super Admin can assign the Super Admin role.');
        }
        // Admin cannot edit a Super Admin account unless they are Super Admin
        if ($user['role'] === 'superadmin' && !$isSuperAdmin && $userId !== $currentUser['id']) {
            Response::forbidden('You do not have permission to modify a Super Admin profile.');
        }

        if ($role !== null && !in_array($role, ['member', 'admin', 'superadmin'])) {
            Response::badRequest('Invalid role value.');
        }
        if ($status !== null && !in_array($status, ['active', 'inactive', 'pending', 'suspended', 'deactivated'])) {
            Response::badRequest('Invalid status value.');
        }
    }

    // Email Uniqueness Check
    if ($email !== null && $email !== $user['email']) {
        $stmtCheck = $db->prepare("SELECT id FROM users WHERE email = :email AND id != :id");
        $stmtCheck->execute([':email' => $email, ':id' => $userId]);
        if ($stmtCheck->fetch()) {
            Response::badRequest('This email address is already taken by another user.');
        }
    }
    
    // Apply update
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
        ':first_name' => $firstName !== null ? $firstName : $user['first_name'],
        ':middle_name' => $middleName !== null ? $middleName : $user['middle_name'],
        ':last_name' => $lastName !== null ? $lastName : $user['last_name'],
        ':phone' => $phone !== null ? $phone : $user['phone'],
        ':address' => $address !== null ? $address : $user['address'],
        ':role' => $role !== null ? $role : $user['role'],
        ':status' => $status !== null ? $status : $user['status'],
        ':email' => $email !== null ? $email : $user['email'],
        ':id' => $userId
    ];

    if (!empty($password)) {
        $sql .= ", password_hash = :password_hash";
        $params[':password_hash'] = password_hash($password, PASSWORD_DEFAULT);
    }

    $sql .= " WHERE id = :id";
    $stmtUpdate = $db->prepare($sql);
    $stmtUpdate->execute($params);

    // If approving a pending account, send welcome notification
    if ($user['status'] === 'pending' && $status === 'active') {
        try {
            $stmtNotif = $db->prepare("
                INSERT INTO notifications (user_id, title, message, type)
                VALUES (:uid, 'Library Card Approved', 'Welcome to Balingasag Municipal Library! Your account registration has been approved. You can now borrow books and access digital resources.', 'announcement')
            ");
            $stmtNotif->execute([':uid' => $userId]);
        } catch (Exception $e) {}
    }

    logActivity(
        $currentUser['id'],
        'update_user',
        'UserManagement',
        "Updated profile for user {$user['email']} (Role: " . ($role ?? $user['role']) . ", Status: " . ($status ?? $user['status']) . ")"
    );

    Response::success(null, 'User profile updated successfully.');

} catch (PDOException $e) {
    Response::error('Server database error: ' . $e->getMessage());
}

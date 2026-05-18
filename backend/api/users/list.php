<?php
// backend/api/users/list.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/middleware.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed. Only GET is supported.', 405);
}

// Admin Route Guard
Middleware::requireAdmin();

try {
    $db = Database::getConnection();
    
    // Joint query to pull user profile details alongside their active loan counts and unpaid fine totals
    $sql = "
        SELECT 
            u.id, 
            u.first_name, 
            u.last_name, 
            u.email, 
            u.role, 
            u.phone, 
            u.address, 
            u.status, 
            u.member_since,
            u.created_at,
            (SELECT COUNT(*) FROM transactions t WHERE t.user_id = u.id AND t.status IN ('active', 'overdue')) AS active_loans,
            COALESCE((SELECT SUM(f.amount) FROM fines f WHERE f.user_id = u.id AND f.status = 'unpaid'), 0.00) AS total_unpaid_fines
        FROM users u
        ORDER BY u.role ASC, u.last_name ASC, u.first_name ASC
    ";
    
    $stmt = $db->query($sql);
    $users = $stmt->fetchAll();
    
    Response::success($users, 'User registry loaded successfully.');

} catch (PDOException $e) {
    Response::error('Server database error: ' . $e->getMessage());
}

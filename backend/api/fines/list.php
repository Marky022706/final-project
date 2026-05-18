<?php
// backend/api/fines/list.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/middleware.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed. Only GET is supported.', 405);
}

// Authenticate user
$currentUser = Middleware::requireAuth();

$status = $_GET['status'] ?? ''; // 'unpaid', 'paid', 'waived', or '' for all

try {
    $db = Database::getConnection();
    
    // Dynamic query building
    $whereClauses = [];
    $params = [];
    
    // Non-admins can ONLY see their own fines
    if ($currentUser['role'] !== 'admin') {
        $whereClauses[] = "f.user_id = :user_id";
        $params[':user_id'] = $currentUser['id'];
    }
    
    if (!empty($status)) {
        $whereClauses[] = "f.status = :status";
        $params[':status'] = $status;
    }
    
    $whereSql = '';
    if (!empty($whereClauses)) {
        $whereSql = ' WHERE ' . implode(' AND ', $whereClauses);
    }
    
    // Join query
    $sql = "
        SELECT 
            f.id, 
            f.fine_id, 
            f.amount, 
            f.reason, 
            f.status, 
            f.created_at, 
            f.paid_date,
            u.first_name, 
            u.last_name, 
            u.email,
            b.title AS book_title,
            t.transaction_id
        FROM fines f
        JOIN users u ON f.user_id = u.id
        JOIN transactions t ON f.transaction_id = t.id
        JOIN books b ON t.book_id = b.id
        " . $whereSql . "
        ORDER BY f.status ASC, f.created_at DESC
    ";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $fines = $stmt->fetchAll();
    
    Response::success($fines, 'Fines retrieved successfully.');

} catch (PDOException $e) {
    Response::error('Server database error: ' . $e->getMessage());
}

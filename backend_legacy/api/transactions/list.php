<?php
// backend/api/transactions/list.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/middleware.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed. Only GET is supported.', 405);
}

// Authenticate user
$currentUser = Middleware::requireAuth();

$status = $_GET['status'] ?? '';
$filterUserId = $_GET['user_id'] ?? null;

$isStaff = in_array($currentUser['role'] ?? '', ['admin', 'superadmin']);

// Access control check
if ($isStaff) {
    // Staff can see global listings or filter by specific member
    $targetUserId = !empty($filterUserId) ? $filterUserId : null;
} else {
    // Members can ONLY query their own history
    $targetUserId = $currentUser['id'];
}

try {
    $db = Database::getConnection();
    
    // Dynamic WHERE clauses
    $whereClauses = [];
    $params = [];
    
    if (!empty($targetUserId)) {
        $whereClauses[] = "t.user_id = :user_id";
        $params[':user_id'] = $targetUserId;
    }
    
    if (!empty($status)) {
        $whereClauses[] = "t.status = :status";
        $params[':status'] = $status;
    }
    
    $whereSql = '';
    if (!empty($whereClauses)) {
        $whereSql = ' WHERE ' . implode(' AND ', $whereClauses);
    }
    
    // Joint Query
    $sql = "
        SELECT 
            t.id, 
            t.transaction_id, 
            t.user_id, 
            t.book_id, 
            t.borrow_date, 
            t.due_date, 
            t.return_date, 
            t.renewal_count AS renewals,
            t.renewal_count, 
            t.status,
            u.first_name, 
            u.last_name, 
            u.email,
            b.title, 
            b.author, 
            b.isbn,
            b.cover_image,
            f.amount AS fine_amount,
            f.status AS fine_status
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        JOIN books b ON t.book_id = b.id
        LEFT JOIN fines f ON t.id = f.transaction_id
        " . $whereSql . "
        ORDER BY t.borrow_date DESC, t.id DESC
    ";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Dynamic overlay: double check if some active transactions are overdue in real-time
    $freshTransactions = [];
    
    foreach ($transactions as $txn) {
        $isOverdueNow = ($txn['status'] === 'active' && strtotime($txn['due_date']) < time());
        
        if ($isOverdueNow) {
            $stmtUpdateStatus = $db->prepare("UPDATE transactions SET status = 'overdue' WHERE id = :id");
            $stmtUpdateStatus->execute([':id' => $txn['id']]);
            $txn['status'] = 'overdue';
        }
        
        $freshTransactions[] = $txn;
    }
    
    Response::success($freshTransactions, 'Transactions fetched successfully.');

} catch (PDOException $e) {
    Response::error('Server database error: ' . $e->getMessage());
}

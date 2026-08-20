<?php
// backend/api/attendance/list.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/middleware.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed. Only GET is supported.', 405);
}

$currentUser = Middleware::requireAdmin();

try {
    $db = Database::getConnection();
    
    // Get query parameters
    $status = $_GET['status'] ?? '';
    $dateFrom = $_GET['date_from'] ?? '';
    $dateTo = $_GET['date_to'] ?? '';
    $userId = $_GET['user_id'] ?? '';
    $limit = isset($_GET['limit']) ? min(500, max(1, (int)$_GET['limit'])) : 100;
    
    // Build query
    $whereClauses = [];
    $params = [];
    
    if (!empty($status)) {
        $whereClauses[] = "a.status = :status";
        $params[':status'] = $status;
    }
    
    if (!empty($dateFrom)) {
        $whereClauses[] = "DATE(a.time_in) >= :date_from";
        $params[':date_from'] = $dateFrom;
    }
    
    if (!empty($dateTo)) {
        $whereClauses[] = "DATE(a.time_in) <= :date_to";
        $params[':date_to'] = $dateTo;
    }
    
    if (!empty($userId)) {
        $whereClauses[] = "a.user_id = :user_id";
        $params[':user_id'] = $userId;
    }
    
    $whereSql = '';
    if (!empty($whereClauses)) {
        $whereSql = ' WHERE ' . implode(' AND ', $whereClauses);
    }
    
    $sql = "
        SELECT 
            a.id,
            a.user_id,
            a.full_name,
            a.role,
            a.purpose,
            a.time_in,
            a.time_out,
            a.visit_duration,
            a.status,
            a.date,
            u.first_name,
            u.last_name,
            u.email,
            u.phone,
            u.qr_code
        FROM attendance a
        LEFT JOIN users u ON a.user_id = u.id
        $whereSql
        ORDER BY a.time_in DESC
        LIMIT $limit
    ";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $attendance = $stmt->fetchAll();
    
    // Format visit duration for completed records
    foreach ($attendance as &$record) {
        $duration = $record['visit_duration'];
        if (!$duration && $record['time_out']) {
            $duration = max(0, strtotime($record['time_out']) - strtotime($record['time_in']));
        }
        if ($duration && ($record['status'] === 'completed' || $record['time_out'])) {
            $record['formatted_duration'] = gmdate('H:i:s', (int)$duration);
        } else {
            $record['formatted_duration'] = null;
        }
    }
    
    Response::success([
        'attendance' => $attendance ?: []
    ], 'Attendance records retrieved successfully!');
    
} catch (PDOException $e) {
    Response::error('Server database error: ' . $e->getMessage());
}

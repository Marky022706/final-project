<?php
// backend/api/attendance/stats.php
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
    
    $today = date('Y-m-d');
    
    // Total visitors today
    $stmt = $db->prepare("SELECT COUNT(*) FROM attendance WHERE DATE(time_in) = :today");
    $stmt->execute([':today' => $today]);
    $totalVisitorsToday = (int)$stmt->fetchColumn();
    
    // Current visitors inside (active status or time_out IS NULL)
    $stmt = $db->prepare("SELECT COUNT(*) FROM attendance WHERE (status = 'active' OR time_out IS NULL) AND DATE(time_in) = :today");
    $stmt->execute([':today' => $today]);
    $currentVisitorsInside = (int)$stmt->fetchColumn();
    
    // Daily stats for the last 30 days
    $stmt = $db->prepare("
        SELECT 
            DATE(time_in) as date,
            COUNT(*) as visitors,
            SUM(COALESCE(visit_duration, CASE WHEN time_out IS NOT NULL THEN TIMESTAMPDIFF(SECOND, time_in, time_out) ELSE 0 END)) as total_duration
        FROM attendance 
        WHERE time_in >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(time_in)
        ORDER BY date DESC
    ");
    $stmt->execute();
    $dailyStats = $stmt->fetchAll();
    
    // Peak visiting hours (hour of day)
    $stmt = $db->query("
        SELECT 
            HOUR(time_in) as hour,
            COUNT(*) as count
        FROM attendance 
        WHERE time_in >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY HOUR(time_in)
        ORDER BY count DESC
        LIMIT 5
    ");
    $peakHours = $stmt->fetchAll();
    
    // Average visit duration (completed visits in seconds)
    $stmt = $db->query("
        SELECT AVG(COALESCE(visit_duration, TIMESTAMPDIFF(SECOND, time_in, time_out))) as avg_duration
        FROM attendance 
        WHERE (status = 'completed' OR time_out IS NOT NULL) AND time_out >= time_in
    ");
    $avgDuration = $stmt->fetchColumn();
    
    // Most frequent visitors
    $stmt = $db->query("
        SELECT 
            u.id,
            u.first_name,
            u.last_name,
            u.email,
            COUNT(a.id) as visit_count
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        GROUP BY u.id, u.first_name, u.last_name, u.email
        ORDER BY visit_count DESC
        LIMIT 10
    ");
    $frequentVisitors = $stmt->fetchAll();
    
    // Weekly stats
    $stmt = $db->prepare("
        SELECT 
            WEEK(time_in) as week,
            YEAR(time_in) as year,
            COUNT(*) as visitors
        FROM attendance 
        WHERE time_in >= DATE_SUB(CURDATE(), INTERVAL 12 WEEK)
        GROUP BY YEAR(time_in), WEEK(time_in)
        ORDER BY year DESC, week DESC
    ");
    $stmt->execute();
    $weeklyStats = $stmt->fetchAll();
    
    // Monthly stats
    $stmt = $db->prepare("
        SELECT 
            MONTH(time_in) as month,
            YEAR(time_in) as year,
            COUNT(*) as visitors
        FROM attendance 
        WHERE time_in >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY YEAR(time_in), MONTH(time_in)
        ORDER BY year DESC, month DESC
    ");
    $stmt->execute();
    $monthlyStats = $stmt->fetchAll();
    
    Response::success([
        'total_visitors_today' => $totalVisitorsToday,
        'current_visitors_inside' => $currentVisitorsInside,
        'average_visit_duration' => $avgDuration ? gmdate('H:i:s', (int)$avgDuration) : '00:00:00',
        'daily_stats' => $dailyStats ?: [],
        'peak_hours' => $peakHours ?: [],
        'frequent_visitors' => $frequentVisitors ?: [],
        'weekly_stats' => $weeklyStats ?: [],
        'monthly_stats' => $monthlyStats ?: []
    ], 'Attendance statistics retrieved successfully!');
    
} catch (PDOException $e) {
    Response::error('Server database error: ' . $e->getMessage());
}

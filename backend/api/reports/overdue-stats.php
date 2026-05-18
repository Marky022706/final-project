<?php
// backend/api/reports/overdue-stats.php
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
    
    // 1. General Overview Counts
    $totalBooks = (int)$db->query("SELECT COALESCE(SUM(total_copies), 0) FROM books")->fetchColumn();
    $totalMembers = (int)$db->query("SELECT COUNT(*) FROM users WHERE role = 'member'")->fetchColumn();
    $activeLoans = (int)$db->query("SELECT COUNT(*) FROM transactions WHERE status IN ('active', 'overdue')")->fetchColumn();
    $overdueLoans = (int)$db->query("SELECT COUNT(*) FROM transactions WHERE status = 'overdue'")->fetchColumn();

    // 2. Fines Aggregates
    $totalUnpaidFines = (float)$db->query("SELECT COALESCE(SUM(amount), 0.00) FROM fines WHERE status = 'unpaid'")->fetchColumn();
    $totalPaidFines = (float)$db->query("SELECT COALESCE(SUM(amount), 0.00) FROM fines WHERE status = 'paid'")->fetchColumn();
    
    // 3. Last 6 Months Fine Collections (Revenue Line Chart)
    $sqlRevenue = "
        SELECT 
            DATE_FORMAT(paid_date, '%b %Y') AS month,
            SUM(amount) AS revenue,
            COUNT(id) AS payments
        FROM fines
        WHERE status = 'paid' AND paid_date >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(paid_date, '%Y-%m'), DATE_FORMAT(paid_date, '%b %Y')
        ORDER BY MIN(paid_date) ASC
    ";
    $stmtRev = $db->query($sqlRevenue);
    $monthlyRevenue = $stmtRev->fetchAll();
    
    // Make sure we supply at least some empty months if DB is fresh
    if (empty($monthlyRevenue)) {
        for ($i = 5; $i >= 0; $i--) {
            $monthlyRevenue[] = [
                'month' => date('M Y', strtotime("-$i months")),
                'revenue' => 0.00,
                'payments' => 0
            ];
        }
    }

    Response::success([
        'kpis' => [
            'total_books' => $totalBooks,
            'total_members' => $totalMembers,
            'active_loans' => $activeLoans,
            'overdue_loans' => $overdueLoans,
            'unpaid_fines' => $totalUnpaidFines,
            'paid_fines' => $totalPaidFines
        ],
        'monthly_revenue' => $monthlyRevenue
    ], 'Overdue and revenue analytics compiled successfully.');

} catch (PDOException $e) {
    Response::error('Server database error: ' . $e->getMessage());
}

<?php
// backend/database/test_member_endpoints.php
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';

try {
    $db = Database::getConnection();

    // 1. Test member profile fetch
    $stmt = $db->prepare("SELECT * FROM users WHERE email = 'member@balingasag.gov.ph'");
    $stmt->execute();
    $member = $stmt->fetch(PDO::FETCH_ASSOC);

    echo "Testing endpoints for member {$member['email']} (ID: {$member['id']})...\n";

    // 2. Query transactions
    $stmtTxn = $db->prepare("
        SELECT t.id, t.transaction_id, t.status, t.renewal_count AS renewals, b.title
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        JOIN books b ON t.book_id = b.id
        WHERE t.user_id = :uid
    ");
    $stmtTxn->execute([':uid' => $member['id']]);
    $txns = $stmtTxn->fetchAll(PDO::FETCH_ASSOC);
    echo "✅ Transactions list query: " . count($txns) . " records found.\n";

    // 3. Query reservations
    $stmtRes = $db->prepare("
        SELECT r.id, r.reservation_id, r.status, b.title
        FROM reservations r
        JOIN users u ON r.user_id = u.id
        JOIN books b ON r.book_id = b.id
        WHERE r.user_id = :uid
    ");
    $stmtRes->execute([':uid' => $member['id']]);
    $res = $stmtRes->fetchAll(PDO::FETCH_ASSOC);
    echo "✅ Reservations list query: " . count($res) . " records found.\n";

    echo "All member dashboard database queries executed successfully without errors!\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

<?php
// backend/database/check_transactions.php
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../config/database.php';

try {
    $db = Database::getConnection();
    echo "Connected.\n";

    $tCols = $db->query("SHOW COLUMNS FROM transactions")->fetchAll(PDO::FETCH_COLUMN);
    echo "transactions columns: " . implode(', ', $tCols) . "\n";

    $rCols = $db->query("SHOW COLUMNS FROM reservations")->fetchAll(PDO::FETCH_COLUMN);
    echo "reservations columns: " . implode(', ', $rCols) . "\n";

    $fCols = $db->query("SHOW COLUMNS FROM fines")->fetchAll(PDO::FETCH_COLUMN);
    echo "fines columns: " . implode(', ', $fCols) . "\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

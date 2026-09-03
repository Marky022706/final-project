<?php
// backend/database/verify_reservations.php
// This script verifies the reservations table exists and shows its structure

require_once __DIR__ . '/../config/database.php';

try {
    $db = Database::getConnection();
    
    // Check if table exists
    $stmt = $db->query("SHOW TABLES LIKE 'reservations'");
    $tableExists = $stmt->fetch();
    
    if ($tableExists) {
        echo "✓ Reservations table exists.\n";
        
        // Show table structure
        echo "\nTable structure:\n";
        $stmt = $db->query("DESCRIBE reservations");
        $columns = $stmt->fetchAll();
        foreach ($columns as $column) {
            echo "  - {$column['Field']}: {$column['Type']} {$column['Null']} {$column['Key']}\n";
        }
        
        // Show row count
        $stmt = $db->query("SELECT COUNT(*) FROM reservations");
        $count = $stmt->fetchColumn();
        echo "\nRow count: $count\n";
        
    } else {
        echo "✗ Reservations table does NOT exist.\n";
        exit(1);
    }
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

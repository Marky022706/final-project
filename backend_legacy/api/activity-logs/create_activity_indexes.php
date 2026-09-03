<?php
// backend/database/create_activity_indexes.php
// This script creates indexes for activity_logs table

require_once __DIR__ . '/../config/database.php';

try {
    $db = Database::getConnection();
    
    echo "Creating indexes for activity_logs table...\n";
    
    $indexes = [
        "CREATE INDEX idx_activity_logs_user ON activity_logs(user_id)",
        "CREATE INDEX idx_activity_logs_module ON activity_logs(module)",
        "CREATE INDEX idx_activity_logs_created ON activity_logs(created_at)"
    ];
    
    foreach ($indexes as $indexSql) {
        try {
            $db->exec($indexSql);
            echo "✓ Index created: $indexSql\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), "Duplicate key name") !== false) {
                echo "✓ Index already exists: $indexSql\n";
            } else {
                echo "Note: " . $e->getMessage() . "\n";
            }
        }
    }
    
    echo "\nIndex creation completed.\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

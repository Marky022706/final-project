<?php
// backend/database/add_activity_logs.php
// This script adds the activity_logs table to existing database

require_once __DIR__ . '/../config/database.php';

try {
    $db = Database::getConnection();
    
    echo "Adding activity_logs table...\n";
    
    // Create activity_logs table
    $sql = "
        CREATE TABLE IF NOT EXISTS activity_logs (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            action VARCHAR(100) NOT NULL,
            module VARCHAR(50) NOT NULL,
            description TEXT NOT NULL,
            ip_address VARCHAR(45) NULL,
            user_agent TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    
    $db->exec($sql);
    echo "✓ Activity logs table created\n";
    
    // Create indexes
    $indexes = [
        "CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_activity_logs_module ON activity_logs(module)",
        "CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at)"
    ];
    
    foreach ($indexes as $indexSql) {
        try {
            $db->exec($indexSql);
            echo "✓ Index created\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), "Duplicate key name") !== false) {
                echo "✓ Index already exists\n";
            } else {
                echo "Note: " . $e->getMessage() . "\n";
            }
        }
    }
    
    echo "\nActivity logs table setup completed successfully.\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

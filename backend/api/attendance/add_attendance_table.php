<?php
// backend/database/add_attendance_table.php
// Migration script to add attendance table and update activity logs
require_once __DIR__ . '/../config/database.php';

try {
    $db = Database::getConnection();
    
    // Add qr_code field to users table
    echo "Adding qr_code column to users table...\n";
    $db->exec("ALTER TABLE users ADD COLUMN qr_code VARCHAR(255) UNIQUE NULL AFTER address");
    echo "✓ qr_code column added\n";
    
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "✓ qr_code column already exists\n";
    } else {
        echo "Error adding qr_code column: " . $e->getMessage() . "\n";
    }
}

try {
    $db = Database::getConnection();
    
    // Create qr_attendance table (separate from legacy attendance table)
    echo "Creating qr_attendance table...\n";
    $db->exec("
        CREATE TABLE IF NOT EXISTS qr_attendance (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            time_in DATETIME NOT NULL,
            time_out DATETIME NULL,
            visit_duration INT NULL COMMENT 'Duration in seconds',
            status ENUM('active', 'completed') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_qr_attendance_user (user_id),
            INDEX idx_qr_attendance_date (time_in),
            INDEX idx_qr_attendance_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✓ qr_attendance table created\n";
    
} catch (PDOException $e) {
    echo "Error creating qr_attendance table: " . $e->getMessage() . "\n";
}

try {
    $db = Database::getConnection();
    
    // Update activity_logs table to include more detailed information
    echo "Updating activity_logs table...\n";
    $db->exec("ALTER TABLE activity_logs ADD COLUMN previous_value TEXT NULL AFTER user_agent");
    echo "✓ previous_value column added\n";
    
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "✓ previous_value column already exists\n";
    } else {
        echo "Error adding previous_value column: " . $e->getMessage() . "\n";
    }
}

try {
    $db = Database::getConnection();
    
    $db->exec("ALTER TABLE activity_logs ADD COLUMN new_value TEXT NULL AFTER previous_value");
    echo "✓ new_value column added\n";
    
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "✓ new_value column already exists\n";
    } else {
        echo "Error adding new_value column: " . $e->getMessage() . "\n";
    }
}

try {
    $db = Database::getConnection();
    
    $db->exec("ALTER TABLE activity_logs ADD COLUMN related_entity_id INT NULL AFTER new_value");
    echo "✓ related_entity_id column added\n";
    
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "✓ related_entity_id column already exists\n";
    } else {
        echo "Error adding related_entity_id column: " . $e->getMessage() . "\n";
    }
}

try {
    $db = Database::getConnection();
    
    $db->exec("ALTER TABLE activity_logs ADD COLUMN related_entity_type VARCHAR(50) NULL AFTER related_entity_id");
    echo "✓ related_entity_type column added\n";
    
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "✓ related_entity_type column already exists\n";
    } else {
        echo "Error adding related_entity_type column: " . $e->getMessage() . "\n";
    }
}

echo "\nDatabase migration completed successfully!\n";


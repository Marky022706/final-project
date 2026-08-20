<?php
// backend/database/migrate_reservations.php
// This script migrates the existing reservations table to match the API expectations

require_once __DIR__ . '/../config/database.php';

try {
    $db = Database::getConnection();
    
    echo "Migrating reservations table structure...\n";
    
    // Rename reserved_date to reservation_date
    try {
        $db->exec("ALTER TABLE reservations CHANGE COLUMN reserved_date reservation_date DATE NOT NULL");
        echo "✓ Renamed reserved_date to reservation_date\n";
    } catch (PDOException $e) {
        echo "Note: " . $e->getMessage() . "\n";
    }
    
    // Add notified column if it doesn't exist
    try {
        $db->exec("ALTER TABLE reservations ADD COLUMN notified BOOLEAN DEFAULT FALSE");
        echo "✓ Added notified column\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), "Duplicate column name") !== false) {
            echo "✓ Notified column already exists\n";
        } else {
            echo "Note: " . $e->getMessage() . "\n";
        }
    }
    
    // Update status enum to match API expectations
    try {
        // MySQL doesn't support direct ENUM modification, need to recreate
        $db->exec("ALTER TABLE reservations MODIFY COLUMN status ENUM('pending', 'ready', 'completed', 'cancelled') DEFAULT 'pending'");
        echo "✓ Updated status enum\n";
    } catch (PDOException $e) {
        echo "Note: " . $e->getMessage() . "\n";
    }
    
    // Remove extra columns that aren't needed by the API
    $extraColumns = ['expiry_date', 'ready_date', 'picked_up_date', 'cancelled_date', 'notes'];
    foreach ($extraColumns as $column) {
        try {
            $db->exec("ALTER TABLE reservations DROP COLUMN $column");
            echo "✓ Removed extra column: $column\n";
        } catch (PDOException $e) {
            echo "Note for $column: " . $e->getMessage() . "\n";
        }
    }
    
    echo "\nMigration completed successfully.\n";
    
    // Verify final structure
    echo "\nFinal table structure:\n";
    $stmt = $db->query("DESCRIBE reservations");
    $columns = $stmt->fetchAll();
    foreach ($columns as $column) {
        echo "  - {$column['Field']}: {$column['Type']}\n";
    }
    
} catch (PDOException $e) {
    echo "Error during migration: " . $e->getMessage() . "\n";
    exit(1);
}

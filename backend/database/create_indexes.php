<?php
// backend/database/create_indexes.php
// This script creates the missing indexes for reservations table

require_once __DIR__ . '/../config/database.php';

try {
    $db = Database::getConnection();
    
    // Create indexes (MySQL doesn't support IF NOT EXISTS for indexes)
    $indexes = [
        "CREATE INDEX idx_reservations_status ON reservations(status)",
        "CREATE INDEX idx_reservations_book ON reservations(book_id)",
        "CREATE INDEX idx_reservations_user ON reservations(user_id)"
    ];
    
    foreach ($indexes as $indexSql) {
        try {
            $db->exec($indexSql);
            echo "Index created: " . $indexSql . "\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), "Duplicate key name") !== false) {
                echo "Index already exists: " . $indexSql . "\n";
            } else {
                echo "Index creation note: " . $e->getMessage() . "\n";
            }
        }
    }
    
    echo "Index creation completed.\n";
    
} catch (PDOException $e) {
    echo "Error creating indexes: " . $e->getMessage() . "\n";
    exit(1);
}

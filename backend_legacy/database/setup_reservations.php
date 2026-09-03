<?php
// backend/database/setup_reservations.php
// This script creates the missing reservations table

require_once __DIR__ . '/../config/database.php';

try {
    $db = Database::getConnection();
    
    // Create reservations table
    $sql = "
        CREATE TABLE IF NOT EXISTS reservations (
            id INT PRIMARY KEY AUTO_INCREMENT,
            reservation_id VARCHAR(20) UNIQUE NOT NULL,
            user_id INT NOT NULL,
            book_id INT NOT NULL,
            reservation_date DATE NOT NULL,
            status ENUM('pending', 'ready', 'completed', 'cancelled') DEFAULT 'pending',
            notified BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    
    $db->exec($sql);
    echo "Reservations table created successfully.\n";
    
    // Create indexes
    $indexes = [
        "CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status)",
        "CREATE INDEX IF NOT EXISTS idx_reservations_book ON reservations(book_id)",
        "CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id)"
    ];
    
    foreach ($indexes as $indexSql) {
        try {
            $db->exec($indexSql);
        } catch (PDOException $e) {
            echo "Index creation note: " . $e->getMessage() . "\n";
        }
    }
    
    echo "Reservations table setup completed successfully.\n";
    
} catch (PDOException $e) {
    echo "Error creating reservations table: " . $e->getMessage() . "\n";
    exit(1);
}

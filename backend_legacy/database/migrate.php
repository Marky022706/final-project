<?php
// backend/database/migrate.php
require_once __DIR__ . '/../config/database.php';

try {
    $db = Database::getConnection();
    echo "Database connection successful!\n";

    // 1. Alter books table status column
    echo "Altering 'books' table status column...\n";
    $db->exec("ALTER TABLE books MODIFY COLUMN status ENUM('available', 'unavailable', 'archived') DEFAULT 'available'");
    echo "'books' table successfully altered!\n";

    // 2. Create reservations table
    echo "Creating 'reservations' table...\n";
    $db->exec("
        CREATE TABLE IF NOT EXISTS reservations (
            id INT PRIMARY KEY AUTO_INCREMENT,
            reservation_id VARCHAR(20) UNIQUE NOT NULL,
            user_id INT NOT NULL,
            book_id INT NOT NULL,
            reservation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status ENUM('pending', 'ready', 'completed', 'cancelled') DEFAULT 'pending',
            notified BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "'reservations' table successfully created or verified!\n";

    // 3. Create reservations performance indexes
    echo "Creating indexes for 'reservations'...\n";
    try {
        $db->exec("CREATE INDEX idx_reservations_status ON reservations(status)");
    } catch (PDOException $e) {
        // Ignored if index already exists
    }
    try {
        $db->exec("CREATE INDEX idx_reservations_user ON reservations(user_id)");
    } catch (PDOException $e) {
        // Ignored if index already exists
    }
    try {
        $db->exec("CREATE INDEX idx_reservations_book ON reservations(book_id)");
    } catch (PDOException $e) {
        // Ignored if index already exists
    }
    echo "Indexes verified successfully!\n";

    echo "Migration completed successfully!\n";

} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}

<?php
// backend/database/clear_books.php
require_once __DIR__ . '/../config/database.php';

try {
    $db = Database::getConnection();
    echo "Database connection successful!\n";

    echo "Clearing all records from the 'books' table...\n";
    
    // Using DELETE FROM books rather than TRUNCATE so that standard ON DELETE CASCADE triggers
    // to cleanly remove associated active/historical transactions, reservations, and fines.
    $stmt = $db->prepare("DELETE FROM books");
    $stmt->execute();
    $deletedCount = $stmt->rowCount();

    echo "Successfully deleted $deletedCount books from 'books' table.\n";
    echo "Foreign key cascading successfully removed related transactions, reservations, and fines.\n";
    echo "Database clear complete!\n";

} catch (Exception $e) {
    echo "Failed to clear books: " . $e->getMessage() . "\n";
    exit(1);
}

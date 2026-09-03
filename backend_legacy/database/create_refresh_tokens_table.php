<?php
// backend/database/create_refresh_tokens_table.php
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../config/database.php';

try {
    $db = Database::getConnection();
    echo "Connected to database.\n";

    $stmt = $db->query("SHOW COLUMNS FROM users WHERE Field = 'id'");
    $userCol = $stmt->fetch(PDO::FETCH_ASSOC);
    $userType = $userCol['Type'] ?? 'VARCHAR(64)';
    echo "users.id type: $userType\n";

    $sql = "
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id {$userType} NOT NULL,
            token_hash VARCHAR(255) NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_token_hash (token_hash)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";

    $db->exec($sql);
    echo "Table 'refresh_tokens' created successfully!\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

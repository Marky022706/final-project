<?php
// backend/database/run_master_migration.php
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../config/database.php';

try {
    echo "Connecting to MySQL server...\n";
    $db = Database::getConnection();

    $stmt = $db->query("SHOW COLUMNS FROM users WHERE Field = 'id'");
    $userCol = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "users.id type: " . $userCol['Type'] . "\n";

    $stmt = $db->query("SHOW COLUMNS FROM books WHERE Field = 'id'");
    $bookCol = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "books.id type: " . $bookCol['Type'] . "\n";

    // Helper to check if column exists
    function columnExists($db, $table, $column) {
        $stmt = $db->prepare("
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = :table AND COLUMN_NAME = :col
        ");
        $stmt->execute([':schema' => DB_NAME, ':table' => $table, ':col' => $column]);
        return (int)$stmt->fetchColumn() > 0;
    }

    // 1. Sanitize and Update users table columns and roles
    echo "Updating users table...\n";
    $db->exec("ALTER TABLE users MODIFY COLUMN role VARCHAR(50) DEFAULT 'member'");
    $db->exec("UPDATE users SET role = 'member' WHERE role NOT IN ('member', 'admin', 'superadmin') OR role IS NULL OR role = ''");
    $db->exec("ALTER TABLE users MODIFY COLUMN role ENUM('member', 'admin', 'superadmin') DEFAULT 'member'");

    $db->exec("ALTER TABLE users MODIFY COLUMN status VARCHAR(50) DEFAULT 'active'");
    $db->exec("UPDATE users SET status = 'active' WHERE status NOT IN ('active', 'inactive', 'pending', 'suspended', 'deactivated') OR status IS NULL OR status = ''");
    $db->exec("ALTER TABLE users MODIFY COLUMN status ENUM('active', 'inactive', 'pending', 'suspended', 'deactivated') DEFAULT 'active'");

    if (!columnExists($db, 'users', 'qr_code')) {
        $db->exec("ALTER TABLE users ADD COLUMN qr_code VARCHAR(255) NULL");
    }
    if (!columnExists($db, 'users', 'school_id_image')) {
        $db->exec("ALTER TABLE users ADD COLUMN school_id_image VARCHAR(255) NULL");
    }
    if (!columnExists($db, 'users', 'deleted_at')) {
        $db->exec("ALTER TABLE users ADD COLUMN deleted_at DATETIME NULL");
    }

    // 2. Update books table columns
    echo "Updating books table...\n";
    if (!columnExists($db, 'books', 'accession_number')) {
        $db->exec("ALTER TABLE books ADD COLUMN accession_number VARCHAR(50) NULL");
    }
    if (!columnExists($db, 'books', 'publisher')) {
        $db->exec("ALTER TABLE books ADD COLUMN publisher VARCHAR(150) NULL");
    }
    if (!columnExists($db, 'books', 'shelf_location')) {
        $db->exec("ALTER TABLE books ADD COLUMN shelf_location VARCHAR(50) NULL DEFAULT 'Main Shelf'");
    }
    if (!columnExists($db, 'books', 'format')) {
        $db->exec("ALTER TABLE books ADD COLUMN format VARCHAR(50) DEFAULT 'Paperback'");
    }
    if (!columnExists($db, 'books', 'book_condition')) {
        $db->exec("ALTER TABLE books ADD COLUMN book_condition VARCHAR(50) DEFAULT 'good'");
    }
    if (!columnExists($db, 'books', 'qr_code')) {
        $db->exec("ALTER TABLE books ADD COLUMN qr_code VARCHAR(255) NULL");
    }
    if (!columnExists($db, 'books', 'deleted_at')) {
        $db->exec("ALTER TABLE books ADD COLUMN deleted_at DATETIME NULL");
    }

    $userType = $userCol['Type'];
    $bookType = $bookCol['Type'];

    // 3. Unified Requests Table
    echo "Verifying requests table...\n";
    $db->exec("
        CREATE TABLE IF NOT EXISTS requests (
            id INT PRIMARY KEY AUTO_INCREMENT,
            request_id VARCHAR(30) UNIQUE NOT NULL,
            type ENUM('borrowing', 'archive', 'acquisition') NOT NULL,
            user_id {$userType} NOT NULL,
            book_id {$bookType} NULL,
            title VARCHAR(255) NULL,
            author VARCHAR(150) NULL,
            reason TEXT NULL,
            status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
            approver_id {$userType} NULL,
            approval_date DATETIME NULL,
            remarks TEXT NULL,
            school_id_image VARCHAR(255) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL,
            FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 4. Favorites Table
    echo "Verifying favorites table...\n";
    $db->exec("
        CREATE TABLE IF NOT EXISTS favorites (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id {$userType} NOT NULL,
            book_id {$bookType} NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_fav (user_id, book_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 5. Saved Searches Table
    echo "Verifying saved_searches table...\n";
    $db->exec("
        CREATE TABLE IF NOT EXISTS saved_searches (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id {$userType} NOT NULL,
            search_name VARCHAR(100) NOT NULL,
            filters_json TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 6. Announcements Table
    echo "Verifying announcements table...\n";
    $db->exec("
        CREATE TABLE IF NOT EXISTS announcements (
            id INT PRIMARY KEY AUTO_INCREMENT,
            title VARCHAR(200) NOT NULL,
            content TEXT NOT NULL,
            category VARCHAR(100) DEFAULT 'General',
            author_id {$userType} NOT NULL,
            author_name VARCHAR(150) NULL,
            published_at DATETIME NOT NULL,
            expires_at DATETIME NULL,
            status ENUM('active', 'archived', 'deleted') DEFAULT 'active',
            deleted_at DATETIME NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    $db->exec("ALTER TABLE announcements MODIFY COLUMN category VARCHAR(100) DEFAULT 'General'");
    if (!columnExists($db, 'announcements', 'author_name')) {
        $db->exec("ALTER TABLE announcements ADD COLUMN author_name VARCHAR(150) NULL AFTER author_id");
    }

    // 7. Librarian Notes Table
    echo "Verifying librarian_notes table...\n";
    $db->exec("
        CREATE TABLE IF NOT EXISTS librarian_notes (
            id INT PRIMARY KEY AUTO_INCREMENT,
            librarian_id {$userType} NOT NULL,
            target_type ENUM('book', 'member') NOT NULL,
            target_id VARCHAR(64) NOT NULL,
            note TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (librarian_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 8. System Settings Table
    echo "Recreating/verifying system_settings table...\n";
    if (!columnExists($db, 'system_settings', 'setting_key')) {
        $db->exec("DROP TABLE IF EXISTS system_settings");
        $db->exec("
            CREATE TABLE system_settings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                setting_key VARCHAR(100) UNIQUE NOT NULL,
                setting_value TEXT NOT NULL,
                description VARCHAR(255) NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");
    }

    // 9. Backups Table
    echo "Verifying backups table...\n";
    $db->exec("
        CREATE TABLE IF NOT EXISTS backups (
            id INT PRIMARY KEY AUTO_INCREMENT,
            backup_name VARCHAR(150) NOT NULL,
            file_path VARCHAR(255) NOT NULL,
            file_size_kb INT DEFAULT 0,
            created_by {$userType} NOT NULL,
            status ENUM('completed', 'failed') DEFAULT 'completed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 10. System Logs Table
    echo "Verifying system_logs table...\n";
    $db->exec("
        CREATE TABLE IF NOT EXISTS system_logs (
            id INT PRIMARY KEY AUTO_INCREMENT,
            log_type VARCHAR(50) NOT NULL,
            severity ENUM('info', 'warning', 'critical') DEFAULT 'info',
            message TEXT NOT NULL,
            ip_address VARCHAR(45) NULL,
            user_agent TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 11. Digital Resources Table
    echo "Verifying digital_resources table...\n";
    $db->exec("
        CREATE TABLE IF NOT EXISTS digital_resources (
            id INT PRIMARY KEY AUTO_INCREMENT,
            title VARCHAR(255) NOT NULL,
            author VARCHAR(150) NOT NULL,
            category VARCHAR(100) NOT NULL,
            description TEXT NULL,
            file_url VARCHAR(255) NOT NULL,
            file_type VARCHAR(20) DEFAULT 'PDF',
            file_size_mb DECIMAL(5,2) DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 12. Digital Reading History Table
    echo "Verifying digital_reading_history table...\n";
    $db->exec("
        CREATE TABLE IF NOT EXISTS digital_reading_history (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id {$userType} NOT NULL,
            resource_id INT NOT NULL,
            read_duration_seconds INT DEFAULT 0,
            last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (resource_id) REFERENCES digital_resources(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 13. Populate Default System Settings
    echo "Seeding default system settings...\n";
    $defaultSettings = [
        ['borrowing_limit', '3', 'Maximum books active per member'],
        ['loan_duration_days', '14', 'Standard borrowing duration in days'],
        ['renewal_limit', '1', 'Maximum number of renewals allowed per loan'],
        ['reservation_period_days', '3', 'Days before a ready reservation expires'],
        ['operating_hours', 'Monday - Friday: 8:00 AM - 5:00 PM', 'Public operating hours of the library'],
        ['overdue_policy', 'Daily notifications and borrowing freeze until returned', 'Municipal overdue penalty policy']
    ];

    $stmtSet = $db->prepare("
        INSERT INTO system_settings (setting_key, setting_value, description) 
        VALUES (:key, :val, :desc)
        ON DUPLICATE KEY UPDATE description = VALUES(description)
    ");
    foreach ($defaultSettings as $s) {
        $stmtSet->execute([':key' => $s[0], ':val' => $s[1], ':desc' => $s[2]]);
    }

    // 14. Ensure Super Admin user exists
    echo "Checking Super Admin account...\n";
    $stmt = $db->prepare("SELECT id FROM users WHERE email = 'superadmin@balingasag.gov.ph'");
    $stmt->execute();
    $superadmin = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$superadmin) {
        echo "Creating default Super Admin account (superadmin@balingasag.gov.ph)...\n";
        $superId = is_numeric($db->query("SELECT id FROM users LIMIT 1")->fetchColumn()) ? null : ('USR-' . strtoupper(substr(uniqid(), -6)));
        $insert = $db->prepare("
            INSERT INTO users (" . ($superId ? "id, " : "") . "first_name, middle_name, last_name, email, password_hash, role, phone, address, status, qr_code)
            VALUES (" . ($superId ? ":id, " : "") . "'Master', 'Super', 'Administrator', 'superadmin@balingasag.gov.ph', :pwd, 'superadmin', '09170000000', 'Balingasag Municipal Library HQ', 'active', 'QR-SUPERADMIN-001')
        ");
        $params = [':pwd' => password_hash('admin123', PASSWORD_DEFAULT)];
        if ($superId) $params[':id'] = $superId;
        $insert->execute($params);
        echo "Super Admin account created successfully!\n";
    } else {
        $db->exec("UPDATE users SET role = 'superadmin' WHERE email = 'superadmin@balingasag.gov.ph'");
        echo "Super Admin account verified.\n";
    }

    // 15. Ensure regular Admin exists
    $stmt = $db->prepare("SELECT id FROM users WHERE email = 'admin@balingasag.gov.ph'");
    $stmt->execute();
    if (!$stmt->fetch()) {
        $adminId = is_numeric($db->query("SELECT id FROM users LIMIT 1")->fetchColumn()) ? null : ('USR-' . strtoupper(substr(uniqid(), -6)));
        $insert = $db->prepare("
            INSERT INTO users (" . ($adminId ? "id, " : "") . "first_name, middle_name, last_name, email, password_hash, role, phone, address, status, qr_code)
            VALUES (" . ($adminId ? ":id, " : "") . "'Librarian', 'Municipal', 'Admin', 'admin@balingasag.gov.ph', :pwd, 'admin', '09171234567', 'Municipal Hall, Balingasag', 'active', 'QR-ADMIN-001')
        ");
        $params = [':pwd' => password_hash('admin123', PASSWORD_DEFAULT)];
        if ($adminId) $params[':id'] = $adminId;
        $insert->execute($params);
    }

    // 16. Update books accession numbers & QR codes
    echo "Updating books accession numbers & QR codes...\n";
    $stmtBooks = $db->query("SELECT id, accession_number, qr_code FROM books");
    $books = $stmtBooks->fetchAll(PDO::FETCH_ASSOC);
    $updateBook = $db->prepare("UPDATE books SET accession_number = :acc, qr_code = :qr WHERE id = :id");

    $bIndex = 1;
    foreach ($books as $b) {
        $acc = empty($b['accession_number']) ? ('ACC-' . str_pad($bIndex, 5, '0', STR_PAD_LEFT)) : $b['accession_number'];
        $qr = empty($b['qr_code']) ? ('BOOK-QR-' . str_pad($bIndex, 5, '0', STR_PAD_LEFT)) : $b['qr_code'];
        if (empty($b['accession_number']) || empty($b['qr_code'])) {
            $updateBook->execute([':acc' => $acc, ':qr' => $qr, ':id' => $b['id']]);
        }
        $bIndex++;
    }

    // 17. Seed sample Announcements if empty
    $countAnn = $db->query("SELECT COUNT(*) FROM announcements")->fetchColumn();
    if ($countAnn == 0) {
        echo "Seeding sample announcements...\n";
        $adminRow = $db->query("SELECT id, CONCAT(first_name, ' ', last_name) as name FROM users WHERE role IN ('admin', 'superadmin') LIMIT 1")->fetch(PDO::FETCH_ASSOC);
        $adminId = $adminRow['id'] ?? '1';
        $adminName = $adminRow['name'] ?? 'Municipal Librarian';
        
        $announcements = [
            ['National Book Week 2026 Celebration', 'Join us for a week of reading competitions, storytelling sessions, and new book exhibitions starting next Monday!', 'Event'],
            ['Extended Operating Hours for Exam Period', 'The municipal library will remain open until 7:00 PM on weekdays to support students preparing for quarterly examinations.', 'Notice'],
            ['New Digital Learning Tablets Available', 'Ten new Android tablets loaded with educational e-books are now available for in-library research.', 'New Arrival']
        ];

        $stmt = $db->query("SHOW COLUMNS FROM announcements WHERE Field = 'id'");
        $annIdCol = $stmt->fetch(PDO::FETCH_ASSOC);
        $hasAutoInc = strpos($annIdCol['Extra'] ?? '', 'auto_increment') !== false;
        $annIdType = $annIdCol['Type'] ?? '';
        $isVarcharAnn = stripos($annIdType, 'varchar') !== false || stripos($annIdType, 'char') !== false;

        $hasAuthorName = columnExists($db, 'announcements', 'author_name');

        foreach ($announcements as $idx => $a) {
            $fields = ['title', 'content', 'category', 'author_id', 'published_at'];
            $placeholders = [':title', ':content', ':category', ':author', 'NOW()'];
            $params = [
                ':title' => $a[0],
                ':content' => $a[1],
                ':category' => $a[2],
                ':author' => $adminId
            ];

            if ($isVarcharAnn || !$hasAutoInc) {
                $fields[] = 'id';
                $placeholders[] = ':id';
                $params[':id'] = 'ANN-' . date('Ymd') . '-' . ($idx + 1);
            }
            if ($hasAuthorName) {
                $fields[] = 'author_name';
                $placeholders[] = ':author_name';
                $params[':author_name'] = $adminName;
            }

            $sql = "INSERT INTO announcements (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $placeholders) . ")";
            $seedAnn = $db->prepare($sql);
            $seedAnn->execute($params);
        }
    }

    echo "Master SRS migration completed successfully!\n";

} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}

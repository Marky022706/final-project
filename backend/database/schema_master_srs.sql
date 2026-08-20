-- Balingasag Public Library - Master Database Schema (SRS Compliant)
USE balingasag_library;

-- 1. Update users table columns and roles
ALTER TABLE users 
    MODIFY COLUMN role ENUM('member', 'admin', 'superadmin') DEFAULT 'member',
    MODIFY COLUMN status ENUM('active', 'inactive', 'pending', 'suspended', 'deactivated') DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS school_id_image VARCHAR(255) NULL AFTER qr_code,
    ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL;

-- 2. Update books table columns
ALTER TABLE books 
    ADD COLUMN IF NOT EXISTS accession_number VARCHAR(50) NULL AFTER id,
    ADD COLUMN IF NOT EXISTS publisher VARCHAR(150) NULL AFTER author,
    ADD COLUMN IF NOT EXISTS shelf_location VARCHAR(50) NULL DEFAULT 'Main Shelf' AFTER category,
    ADD COLUMN IF NOT EXISTS format ENUM('Hardcover', 'Paperback', 'E-Book', 'Audiobook', 'Journal') DEFAULT 'Paperback' AFTER shelf_location,
    ADD COLUMN IF NOT EXISTS book_condition ENUM('new', 'good', 'fair', 'damaged', 'lost', 'under_maintenance') DEFAULT 'good' AFTER available_copies,
    ADD COLUMN IF NOT EXISTS qr_code VARCHAR(255) NULL AFTER book_condition,
    ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL AFTER status;

-- 3. Unified Requests Table
CREATE TABLE IF NOT EXISTS requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_id VARCHAR(30) UNIQUE NOT NULL,
    type ENUM('borrowing', 'archive', 'acquisition') NOT NULL,
    user_id INT NOT NULL,
    book_id INT NULL,
    title VARCHAR(255) NULL,
    author VARCHAR(150) NULL,
    reason TEXT NULL,
    status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
    approver_id INT NULL,
    approval_date DATETIME NULL,
    remarks TEXT NULL,
    school_id_image VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL,
    FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Favorites Table (Member reading list)
CREATE TABLE IF NOT EXISTS favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_fav (user_id, book_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Saved Searches Table
CREATE TABLE IF NOT EXISTS saved_searches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    search_name VARCHAR(100) NOT NULL,
    filters_json TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category ENUM('Event', 'Schedule', 'Notice', 'New Arrival', 'General') DEFAULT 'General',
    author_id INT NOT NULL,
    published_at DATETIME NOT NULL,
    expires_at DATETIME NULL,
    status ENUM('active', 'archived', 'deleted') DEFAULT 'active',
    deleted_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Librarian Notes Table (Private staff notes)
CREATE TABLE IF NOT EXISTS librarian_notes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    librarian_id INT NOT NULL,
    target_type ENUM('book', 'member') NOT NULL,
    target_id INT NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (librarian_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description VARCHAR(255) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Backups Table
CREATE TABLE IF NOT EXISTS backups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    backup_name VARCHAR(150) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_size_kb INT DEFAULT 0,
    created_by INT NOT NULL,
    status ENUM('completed', 'failed') DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. System Logs Table
CREATE TABLE IF NOT EXISTS system_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    log_type ENUM('auth_failure', 'backup', 'restore', 'system_error', 'security_alert') NOT NULL,
    severity ENUM('info', 'warning', 'critical') DEFAULT 'info',
    message TEXT NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Digital Resources Table
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

-- 12. Digital Reading History Table
CREATE TABLE IF NOT EXISTS digital_reading_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    resource_id INT NOT NULL,
    read_duration_seconds INT DEFAULT 0,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES digital_resources(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Default System Settings
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES 
    ('borrowing_limit', '3', 'Maximum books active per member'),
    ('loan_duration_days', '14', 'Standard borrowing duration in days'),
    ('renewal_limit', '1', 'Maximum number of renewals allowed per loan'),
    ('reservation_period_days', '3', 'Days before a ready reservation expires'),
    ('operating_hours', 'Monday - Friday: 8:00 AM - 5:00 PM', 'Public operating hours of the library'),
    ('overdue_policy', 'Daily notifications and borrowing freeze until returned', 'Municipal overdue penalty policy')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- 14. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_type ON requests(type);
CREATE INDEX IF NOT EXISTS idx_requests_user ON requests(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_system_logs_type ON system_logs(log_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_created ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_books_accession ON books(accession_number);
CREATE INDEX IF NOT EXISTS idx_books_deleted ON books(deleted_at);

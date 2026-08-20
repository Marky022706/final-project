-- ==============================================================================
-- BALINGASAG MUNICIPAL PUBLIC LIBRARY - SMART LIBRARY MANAGEMENT SYSTEM
-- Master Consolidated Database Schema & Seeder
-- Database Name: balingasag_library
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `balingasag_library` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `balingasag_library`;

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. Table: users
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `id` VARCHAR(64) PRIMARY KEY,
    `member_id` VARCHAR(50) NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `middle_name` VARCHAR(100) NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) UNIQUE NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `phone_number` VARCHAR(20) NULL,
    `address` TEXT NULL,
    `school_or_org` VARCHAR(150) NULL,
    `role` ENUM('member', 'admin', 'superadmin') DEFAULT 'member',
    `status` ENUM('active', 'inactive', 'pending', 'suspended', 'deactivated') DEFAULT 'pending',
    `avatar_url` VARCHAR(255) NULL,
    `qr_code` VARCHAR(255) NULL,
    `qr_code_data` VARCHAR(255) NULL,
    `school_id_image` VARCHAR(255) NULL,
    `member_since` DATE DEFAULT (CURRENT_DATE),
    `email_verified_at` DATETIME NULL,
    `approved_by` VARCHAR(64) NULL,
    `approved_at` DATETIME NULL,
    `deleted_at` DATETIME NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_role` (`role`),
    INDEX `idx_users_status` (`status`),
    INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Table: refresh_tokens
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `refresh_tokens`;
CREATE TABLE `refresh_tokens` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` VARCHAR(64) NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_token_hash` (`token_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Table: books
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `books`;
CREATE TABLE `books` (
    `id` VARCHAR(64) PRIMARY KEY,
    `accession_number` VARCHAR(50) UNIQUE NULL,
    `title` VARCHAR(255) NOT NULL,
    `author` VARCHAR(150) NOT NULL,
    `publisher` VARCHAR(150) NULL,
    `isbn` VARCHAR(30) UNIQUE NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `year` INT NOT NULL,
    `shelf_location` VARCHAR(50) DEFAULT 'Main Shelf',
    `format` VARCHAR(50) DEFAULT 'Paperback',
    `book_condition` ENUM('new', 'good', 'fair', 'damaged', 'lost', 'under_maintenance') DEFAULT 'good',
    `description` TEXT NULL,
    `cover_image` VARCHAR(255) NULL,
    `total_copies` INT DEFAULT 1,
    `available_copies` INT DEFAULT 1,
    `qr_code` VARCHAR(255) NULL,
    `status` ENUM('available', 'unavailable', 'archived', 'reserved', 'maintenance') DEFAULT 'available',
    `deleted_at` DATETIME NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_books_category` (`category`),
    INDEX `idx_books_status` (`status`),
    INDEX `idx_books_accession` (`accession_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Table: transactions (Borrowing & Returning)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `transaction_id` VARCHAR(50) UNIQUE NOT NULL,
    `user_id` VARCHAR(64) NOT NULL,
    `book_id` VARCHAR(64) NOT NULL,
    `borrow_date` DATE NOT NULL,
    `due_date` DATE NOT NULL,
    `return_date` DATE NULL,
    `renewal_count` INT DEFAULT 0,
    `status` ENUM('active', 'returned', 'overdue') DEFAULT 'active',
    `remarks` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE,
    INDEX `idx_txn_status` (`status`),
    INDEX `idx_txn_due_date` (`due_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. Table: reservations
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `reservations`;
CREATE TABLE `reservations` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `reservation_id` VARCHAR(50) UNIQUE NOT NULL,
    `user_id` VARCHAR(64) NOT NULL,
    `book_id` VARCHAR(64) NOT NULL,
    `reservation_date` DATE NOT NULL,
    `expiration_date` DATE NULL,
    `status` ENUM('pending', 'ready', 'fulfilled', 'cancelled', 'expired') DEFAULT 'pending',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE,
    INDEX `idx_res_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. Table: fines
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `fines`;
CREATE TABLE `fines` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` VARCHAR(64) NOT NULL,
    `transaction_id` INT NULL,
    `amount` DECIMAL(8,2) NOT NULL,
    `reason` VARCHAR(255) NOT NULL,
    `status` ENUM('unpaid', 'paid', 'waived') DEFAULT 'unpaid',
    `paid_at` DATETIME NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE SET NULL,
    INDEX `idx_fines_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. Table: requests (Unified Borrowing, Archival, Acquisition Requests)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `requests`;
CREATE TABLE `requests` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `request_id` VARCHAR(50) UNIQUE NOT NULL,
    `type` ENUM('borrowing', 'archive', 'acquisition') NOT NULL,
    `user_id` VARCHAR(64) NOT NULL,
    `book_id` VARCHAR(64) NULL,
    `title` VARCHAR(255) NULL,
    `author` VARCHAR(150) NULL,
    `reason` TEXT NULL,
    `status` ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
    `approver_id` VARCHAR(64) NULL,
    `approval_date` DATETIME NULL,
    `remarks` TEXT NULL,
    `school_id_image` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`approver_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_requests_type_status` (`type`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. Table: favorites (Member Reading Wishlist)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `favorites`;
CREATE TABLE `favorites` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` VARCHAR(64) NOT NULL,
    `book_id` VARCHAR(64) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_user_fav` (`user_id`, `book_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. Table: saved_searches (Member Search Bookmarks)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `saved_searches`;
CREATE TABLE `saved_searches` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` VARCHAR(64) NOT NULL,
    `search_name` VARCHAR(100) NOT NULL,
    `filters_json` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. Table: announcements (Public Notices & Library Events)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `announcements`;
CREATE TABLE `announcements` (
    `id` VARCHAR(50) PRIMARY KEY,
    `title` VARCHAR(200) NOT NULL,
    `content` TEXT NOT NULL,
    `category` VARCHAR(100) DEFAULT 'General',
    `author_id` VARCHAR(64) NOT NULL,
    `author_name` VARCHAR(150) NULL,
    `published_at` DATETIME NOT NULL,
    `expires_at` DATETIME NULL,
    `status` ENUM('active', 'archived', 'deleted') DEFAULT 'active',
    `deleted_at` DATETIME NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. Table: attendance (Physical QR Check-in System)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `attendance`;
CREATE TABLE `attendance` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` VARCHAR(64) NOT NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `role` VARCHAR(50) DEFAULT 'member',
    `purpose` VARCHAR(100) DEFAULT 'General Reading',
    `time_in` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `time_out` TIMESTAMP NULL,
    `date` DATE DEFAULT (CURRENT_DATE),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_attendance_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 12. Table: librarian_notes
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `librarian_notes`;
CREATE TABLE `librarian_notes` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `librarian_id` VARCHAR(64) NOT NULL,
    `target_type` ENUM('book', 'member') NOT NULL,
    `target_id` VARCHAR(64) NOT NULL,
    `note` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`librarian_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 13. Table: system_settings
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE `system_settings` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `setting_key` VARCHAR(100) UNIQUE NOT NULL,
    `setting_value` TEXT NOT NULL,
    `description` VARCHAR(255) NULL,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 14. Table: backups (Super Admin Disaster Recovery Snapshots)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `backups`;
CREATE TABLE `backups` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `backup_name` VARCHAR(150) NOT NULL,
    `file_path` VARCHAR(255) NOT NULL,
    `file_size_kb` INT DEFAULT 0,
    `created_by` VARCHAR(64) NOT NULL,
    `status` ENUM('completed', 'failed') DEFAULT 'completed',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 15. Table: system_logs (Super Admin Security Audit)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `system_logs`;
CREATE TABLE `system_logs` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `log_type` VARCHAR(50) NOT NULL,
    `severity` ENUM('info', 'warning', 'critical') DEFAULT 'info',
    `message` TEXT NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_system_logs_type` (`log_type`),
    INDEX `idx_system_logs_severity` (`severity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 16. Table: activity_logs (General System Audit Trail)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE `activity_logs` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` VARCHAR(64) NULL,
    `action` VARCHAR(50) NOT NULL,
    `module` VARCHAR(50) NOT NULL,
    `description` TEXT NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_activity_module` (`module`),
    INDEX `idx_activity_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 17. Table: notifications
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` VARCHAR(64) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `message` TEXT NOT NULL,
    `type` ENUM('overdue', 'due_soon', 'reservation', 'fine', 'announcement') NOT NULL,
    `is_read` TINYINT(1) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_notif_user_read` (`user_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 18. Table: digital_resources (Digital e-Library)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `digital_resources`;
CREATE TABLE `digital_resources` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `author` VARCHAR(150) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `file_url` VARCHAR(255) NOT NULL,
    `file_type` VARCHAR(20) DEFAULT 'PDF',
    `file_size_mb` DECIMAL(5,2) DEFAULT 0.00,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_digital_cat` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 19. Table: digital_reading_history
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `digital_reading_history`;
CREATE TABLE `digital_reading_history` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` VARCHAR(64) NOT NULL,
    `resource_id` INT NOT NULL,
    `read_duration_seconds` INT DEFAULT 0,
    `last_accessed` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`resource_id`) REFERENCES `digital_resources`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

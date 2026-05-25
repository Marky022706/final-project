-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.4.3 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for balingasag_library
CREATE DATABASE IF NOT EXISTS `balingasag_library` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `balingasag_library`;

-- Dumping structure for table balingasag_library.books
CREATE TABLE IF NOT EXISTS `books` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `author` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isbn` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year` int NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `cover_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_copies` int DEFAULT '1',
  `available_copies` int DEFAULT '1',
  `status` enum('available','unavailable','archived') COLLATE utf8mb4_unicode_ci DEFAULT 'available',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `isbn` (`isbn`),
  KEY `idx_books_isbn` (`isbn`),
  KEY `idx_books_category` (`category`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table balingasag_library.books: ~20 rows (approximately)
INSERT INTO `books` (`id`, `title`, `author`, `isbn`, `category`, `year`, `description`, `cover_image`, `total_copies`, `available_copies`, `status`, `created_at`) VALUES
	(1, 'Nineteen Eighty-Four', 'George Orwell', '9780451524935', 'Fiction', 1993, 'An immersive and exquisitely crafted fiction classic, &quot;Nineteen Eighty-Four&quot; by George Orwell (1993) stands as a stellar contribution to modern literature. The book skillfully weaves elements of suspense, discovery, and philosophy to create a memorable and highly recommended reading experience. An essential volume for the Balingasag Municipal Public Library shelves.', 'https://covers.openlibrary.org/b/id/12054527-L.jpg', 1, 1, 'available', '2026-05-24 13:49:03'),
	(2, 'The Hobbit', 'J.R.R. Tolkien', '9780547928227', 'Fiction', 2012, '&quot;The Hobbit&quot; is a compelling fiction work written by the distinguished author J.R.R. Tolkien in 2012. Set against a richly woven backdrop, this masterpiece explores the intricate human condition, challenging readers&#039; perceptions through its powerful storytelling. An exceptional addition to the library, it remains highly recommended for anyone interested in deep, thought-provoking literature.', 'https://covers.openlibrary.org/b/id/12003329-L.jpg', 3, 3, 'available', '2026-05-24 13:49:22'),
	(3, 'The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 'Fiction', 2021, '&quot;The Great Gatsby&quot; is a compelling fiction work written by the distinguished author F. Scott Fitzgerald in 2021. Set against a richly woven backdrop, this masterpiece explores the intricate human condition, challenging readers&#039; perceptions through its powerful storytelling. An exceptional addition to the library, it remains highly recommended for anyone interested in deep, thought-provoking literature.', 'https://covers.openlibrary.org/b/id/14314120-L.jpg', 3, 3, 'available', '2026-05-24 13:49:38'),
	(4, 'Harry Potter and the Sorcerer&amp;#039;s Stone', 'J. K. Rowling', '9780590353427', 'Fiction', 1999, 'Written by the acclaimed author J. K. Rowling and published in 1999, this outstanding fiction book, &amp;quot;Harry Potter and the Sorcerer&amp;#039;s Stone&amp;quot;, delivers a masterful narrative filled with depth and intellect. It delves into profound themes and captivating character development that keeps readers engrossed from the very first page. A landmark text in its genre, perfect for local students and avid readers alike.', 'https://covers.openlibrary.org/b/id/15160586-L.jpg', 1, 0, 'unavailable', '2026-05-24 13:50:13'),
	(5, 'Better Place', 'Duane Murray, Shawn Daley', '9781603094955', 'Fiction', 2021, 'An immersive and exquisitely crafted fiction classic, &amp;amp;amp;quot;Better Place&amp;amp;amp;quot; by Duane Murray, Shawn Daley (2021) stands as a stellar contribution to modern literature. The book skillfully weaves elements of suspense, discovery, and philosophy to create a memorable and highly recommended reading experience. An essential volume for the Balingasag Municipal Public Library shelves.', 'https://covers.openlibrary.org/b/id/11996578-L.jpg', 1, 0, 'unavailable', '2026-05-24 13:50:41'),
	(6, 'Ballad for Sophie', 'Filipe Melo, Juan Cavia, Gabriela Soares', '9781603094986', 'Fiction', 2021, 'An immersive and exquisitely crafted fiction classic, &quot;Ballad for Sophie&quot; by Filipe Melo, Juan Cavia, Gabriela Soares (2021) stands as a stellar contribution to modern literature. The book skillfully weaves elements of suspense, discovery, and philosophy to create a memorable and highly recommended reading experience. An essential volume for the Balingasag Municipal Public Library shelves.', 'https://covers.openlibrary.org/b/id/11996564-L.jpg', 3, 2, 'available', '2026-05-24 13:50:56'),
	(7, 'F. A. R. M. System', 'Rich Koslowski', '9781603095686', 'Fiction', 2025, 'Written by the acclaimed author Rich Koslowski and published in 2025, this outstanding fiction book, &quot;F. A. R. M. System&quot;, delivers a masterful narrative filled with depth and intellect. It delves into profound themes and captivating character development that keeps readers engrossed from the very first page. A landmark text in its genre, perfect for local students and avid readers alike.', '', 3, 3, 'available', '2026-05-24 13:51:13'),
	(8, 'I Am Going To Be Small', 'Jeffrey Brown', '9781891830860', 'Fiction', 2006, 'Written by the acclaimed author Jeffrey Brown and published in 2006, this outstanding fiction book, &quot;I Am Going To Be Small&quot;, delivers a masterful narrative filled with depth and intellect. It delves into profound themes and captivating character development that keeps readers engrossed from the very first page. A landmark text in its genre, perfect for local students and avid readers alike.', 'https://covers.openlibrary.org/b/id/12722591-L.jpg', 3, 3, 'available', '2026-05-24 13:51:33'),
	(9, 'You Wish (Book 1)', 'Jeff Victor', '9781603095327', 'Fiction', 2023, 'In this highly acclaimed fiction volume, &quot;You Wish (Book 1)&quot;, published in 2023, the renowned author Jeff Victor presents a brilliantly researched and captivating perspective. Known for its engaging prose and stunning emotional resonance, the book leads readers through an unforgettable journey of learning and personal growth. A highly sought-after reference in our catalog.', '', 3, 3, 'available', '2026-05-24 13:52:15'),
	(10, 'Shred or Dead', 'D. Bradford Gambles', '9781603095471', 'Fiction', 2025, 'Written by the acclaimed author D. Bradford Gambles and published in 2025, this outstanding fiction book, &quot;Shred or Dead&quot;, delivers a masterful narrative filled with depth and intellect. It delves into profound themes and captivating character development that keeps readers engrossed from the very first page. A landmark text in its genre, perfect for local students and avid readers alike.', 'https://covers.openlibrary.org/b/id/14856240-L.jpg', 3, 3, 'available', '2026-05-24 13:53:13'),
	(11, 'The autobiography of Malcolm X', 'Alex Haley, Malcolm X', '9780345350688', 'Mahometanos Negros', 1990, 'Written by the acclaimed author Alex Haley, Malcolm X and published in 1990, this outstanding mahometanos negros book, &quot;The autobiography of Malcolm X&quot;, delivers a masterful narrative filled with depth and intellect. It delves into profound themes and captivating character development that keeps readers engrossed from the very first page. A landmark text in its genre, perfect for local students and avid readers alike.', 'https://covers.openlibrary.org/b/id/15220283-L.jpg', 1, 1, 'available', '2026-05-24 14:41:30'),
	(12, 'I Know Why the Caged Bird Sings', 'Maya Angelou', '9780345514400', 'Social Life And Customs', 2009, '', 'https://covers.openlibrary.org/b/id/6304869-L.jpg', 1, 1, 'available', '2026-05-24 14:41:52'),
	(13, 'A Brief History of Time', 'Stephen Hawking', '9780553380163', 'Cosmologie', 1998, '', 'https://covers.openlibrary.org/b/id/14589690-L.jpg', 1, 1, 'available', '2026-05-24 14:42:11'),
	(14, 'The Diary of a Young Girl', 'Anne Frank', '9780553296983', 'Fiction', 1993, '&quot;The Diary of a Young Girl&quot; is a compelling fiction work written by the distinguished author Anne Frank in 1993. Set against a richly woven backdrop, this masterpiece explores the intricate human condition, challenging readers&#039; perceptions through its powerful storytelling. An exceptional addition to the library, it remains highly recommended for anyone interested in deep, thought-provoking literature.', 'https://covers.openlibrary.org/b/id/8583953-L.jpg', 3, 3, 'available', '2026-05-25 00:18:30'),
	(15, 'Into the wild', 'Jon Krakauer', '9780385486804', 'Fiction', 1997, 'An immersive and exquisitely crafted fiction classic, &quot;Into the wild&quot; by Jon Krakauer (1997) stands as a stellar contribution to modern literature. The book skillfully weaves elements of suspense, discovery, and philosophy to create a memorable and highly recommended reading experience. An essential volume for the Balingasag Municipal Public Library shelves.', 'https://covers.openlibrary.org/b/id/241290-L.jpg', 1, 1, 'available', '2026-05-25 00:18:58'),
	(16, 'Cosmos', 'Carl Sagan', '9780345539434', 'Fiction', 2013, 'Written by the acclaimed author Carl Sagan and published in 2013, this outstanding fiction book, &quot;Cosmos&quot;, delivers a masterful narrative filled with depth and intellect. It delves into profound themes and captivating character development that keeps readers engrossed from the very first page. A landmark text in its genre, perfect for local students and avid readers alike.', 'https://covers.openlibrary.org/b/id/8290911-L.jpg', 3, 3, 'available', '2026-05-25 00:21:35'),
	(17, 'The Sixth Extinction', 'Elizabeth Kolbert, Marcel Blanc', '9781250062185', 'Science', 2015, 'An immersive and exquisitely crafted science classic, &quot;The Sixth Extinction&quot; by Elizabeth Kolbert, Marcel Blanc (2015) stands as a stellar contribution to modern literature. The book skillfully weaves elements of suspense, discovery, and philosophy to create a memorable and highly recommended reading experience. An essential volume for the Balingasag Municipal Public Library shelves.', 'https://covers.openlibrary.org/b/id/7893965-L.jpg', 4, 4, 'available', '2026-05-25 00:21:54'),
	(18, 'Silent spring', 'Rachel Carson', '9780618249060', 'Fiction', 2002, '&quot;Silent spring&quot; is a compelling fiction work written by the distinguished author Rachel Carson in 2002. Set against a richly woven backdrop, this masterpiece explores the intricate human condition, challenging readers&#039; perceptions through its powerful storytelling. An exceptional addition to the library, it remains highly recommended for anyone interested in deep, thought-provoking literature.', 'https://covers.openlibrary.org/b/id/7894378-L.jpg', 1, 1, 'available', '2026-05-25 00:22:08'),
	(19, 'Braiding Sweetgrass', 'Robin Wall Kimmerer, David Muñoz Mateos', '9781571313560', 'Fiction', 2013, 'In this highly acclaimed fiction volume, &quot;Braiding Sweetgrass&quot;, published in 2013, the renowned author Robin Wall Kimmerer, David Muñoz Mateos presents a brilliantly researched and captivating perspective. Known for its engaging prose and stunning emotional resonance, the book leads readers through an unforgettable journey of learning and personal growth. A highly sought-after reference in our catalog.', 'https://covers.openlibrary.org/b/id/12836879-L.jpg', 2, 2, 'available', '2026-05-25 00:22:25'),
	(20, 'The Man Who Mistook His Wife for a Hat and Other Clinical Tales', 'Oliver Sacks', '9780684853949', 'Fiction', 1998, 'Written by the acclaimed author Oliver Sacks and published in 1998, this outstanding fiction book, &quot;The Man Who Mistook His Wife for a Hat and Other Clinical Tales&quot;, delivers a masterful narrative filled with depth and intellect. It delves into profound themes and captivating character development that keeps readers engrossed from the very first page. A landmark text in its genre, perfect for local students and avid readers alike.', 'https://covers.openlibrary.org/b/id/10104616-L.jpg', 3, 3, 'available', '2026-05-25 00:22:47');

-- Dumping structure for table balingasag_library.fines
CREATE TABLE IF NOT EXISTS `fines` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fine_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `transaction_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `status` enum('unpaid','paid','waived') COLLATE utf8mb4_unicode_ci DEFAULT 'unpaid',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `paid_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fine_id` (`fine_id`),
  KEY `user_id` (`user_id`),
  KEY `transaction_id` (`transaction_id`),
  KEY `idx_fines_status` (`status`),
  CONSTRAINT `fines_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fines_ibfk_2` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table balingasag_library.fines: ~0 rows (approximately)

-- Dumping structure for table balingasag_library.notifications
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('due_reminder','overdue','reservation_ready','announcement') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_unread` (`user_id`,`is_read`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table balingasag_library.notifications: ~5 rows (approximately)
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES
	(1, 2, 'Welcome to Balingasag Public Library', 'Welcome! Your library card account is activated. Search the catalog and enjoy borrowing.', 'announcement', 0, '2026-05-24 13:47:17'),
	(2, 3, 'Welcome to Balingasag Public Library', 'Welcome! Your library card account is activated. Search the catalog and enjoy borrowing.', 'announcement', 1, '2026-05-24 13:47:17'),
	(3, 3, 'Book Borrowed Successfully', 'You have borrowed "Ballad for Sophie". Please return it on or before Jun 07, 2026 to avoid late charges.', 'due_reminder', 1, '2026-05-24 13:55:34'),
	(4, 3, 'Book Borrowed Successfully', 'You have borrowed "Better Place". Please return it on or before Jun 07, 2026 to avoid late charges.', 'due_reminder', 1, '2026-05-24 13:55:40'),
	(5, 3, 'Book Borrowed Successfully', 'You have borrowed "I Am Going To Be Small". Please return it on or before Jun 07, 2026 to avoid late charges.', 'due_reminder', 1, '2026-05-24 13:55:43'),
	(6, 3, 'Book Reservation Placed', 'Your reservation for "Better Place" was successfully placed. You will be notified once it is ready for collection.', 'announcement', 1, '2026-05-24 14:20:55'),
	(7, 3, 'Reserved Book Ready', 'The book "Better Place" you reserved is now available! Please borrow it from your dashboard.', 'reservation_ready', 1, '2026-05-24 14:23:11'),
	(8, 3, 'Book Returned Successfully', 'Thank you! The book "Better Place" was returned in good order.', 'announcement', 1, '2026-05-24 14:23:11'),
	(9, 3, 'Book Borrowed Successfully', 'You have borrowed "Better Place". Please return it on or before Jun 07, 2026 to avoid late charges.', 'due_reminder', 1, '2026-05-24 14:23:24'),
	(10, 3, 'Book Returned Successfully', 'Thank you! The book "Better Place" was returned in good order.', 'announcement', 1, '2026-05-24 14:38:30'),
	(11, 3, 'Book Borrowed Successfully', 'You have borrowed "Better Place". Please return it on or before Jun 07, 2026 to avoid late charges.', 'due_reminder', 1, '2026-05-24 14:39:41'),
	(12, 3, 'Book Reservation Placed', 'Your reservation for "Better Place" was successfully placed. You will be notified once it is ready for collection.', 'announcement', 1, '2026-05-24 14:39:45'),
	(13, 3, 'Book Returned Successfully', 'Thank you! The book "I Am Going To Be Small" was returned in good order.', 'announcement', 1, '2026-05-25 00:23:42'),
	(14, 3, 'Book Borrowed Successfully', 'You have borrowed "Harry Potter and the Sorcerer&amp;#039;s Stone". Please return it on or before Jun 08, 2026 to avoid late charges.', 'due_reminder', 1, '2026-05-25 00:23:59');

-- Dumping structure for table balingasag_library.password_reset_codes
CREATE TABLE IF NOT EXISTS `password_reset_codes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_password_reset_phone` (`phone`),
  KEY `idx_password_reset_user_expires` (`user_id`,`expires_at`),
  CONSTRAINT `password_reset_codes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table balingasag_library.password_reset_codes: ~0 rows (approximately)

-- Dumping structure for table balingasag_library.refresh_tokens
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table balingasag_library.refresh_tokens: ~1 rows (approximately)
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `created_at`) VALUES
	(28, 1, 'a20aef2d07040b0ae3a5f0861aa79add31a7457ab47fb944d2223d46a4e154b0', '2026-06-01 00:44:48', '2026-05-25 00:44:48');

-- Dumping structure for table balingasag_library.reservations
CREATE TABLE IF NOT EXISTS `reservations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reservation_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `book_id` int NOT NULL,
  `reservation_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('pending','ready','completed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `notified` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `reservation_id` (`reservation_id`),
  KEY `idx_reservations_status` (`status`),
  KEY `idx_reservations_user` (`user_id`),
  KEY `idx_reservations_book` (`book_id`),
  CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reservations_ibfk_2` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table balingasag_library.reservations: ~0 rows (approximately)
INSERT INTO `reservations` (`id`, `reservation_id`, `user_id`, `book_id`, `reservation_date`, `status`, `notified`) VALUES
	(1, 'RES-20260524-0E12A', 3, 5, '2026-05-24 14:20:55', 'completed', 0),
	(2, 'RES-20260524-17972', 3, 5, '2026-05-24 14:39:45', 'pending', 0);

-- Dumping structure for table balingasag_library.transactions
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transaction_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `book_id` int NOT NULL,
  `borrow_date` date NOT NULL,
  `due_date` date NOT NULL,
  `return_date` date DEFAULT NULL,
  `renewals` int DEFAULT '0',
  `status` enum('active','overdue','completed') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_id` (`transaction_id`),
  KEY `user_id` (`user_id`),
  KEY `book_id` (`book_id`),
  KEY `idx_transactions_status` (`status`),
  KEY `idx_transactions_due_date` (`due_date`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table balingasag_library.transactions: ~6 rows (approximately)
INSERT INTO `transactions` (`id`, `transaction_id`, `user_id`, `book_id`, `borrow_date`, `due_date`, `return_date`, `renewals`, `status`, `created_at`) VALUES
	(1, 'TXN-20260524-832FC', 3, 6, '2026-05-24', '2026-06-07', NULL, 0, 'active', '2026-05-24 13:55:34'),
	(2, 'TXN-20260524-A30FA', 3, 5, '2026-05-24', '2026-06-07', '2026-05-24', 0, 'completed', '2026-05-24 13:55:40'),
	(3, 'TXN-20260524-68B6E', 3, 8, '2026-05-24', '2026-06-07', '2026-05-25', 0, 'completed', '2026-05-24 13:55:43'),
	(4, 'TXN-20260524-56586', 3, 5, '2026-05-24', '2026-06-07', '2026-05-24', 0, 'completed', '2026-05-24 14:23:24'),
	(5, 'TXN-20260524-C9E2F', 3, 5, '2026-05-24', '2026-06-07', NULL, 0, 'active', '2026-05-24 14:39:41'),
	(6, 'TXN-20260525-89ADF', 3, 4, '2026-05-25', '2026-06-08', NULL, 0, 'active', '2026-05-25 00:23:59');

-- Dumping structure for table balingasag_library.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `middle_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('member','admin') COLLATE utf8mb4_unicode_ci DEFAULT 'member',
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `member_since` date DEFAULT (curdate()),
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table balingasag_library.users: ~3 rows (approximately)
INSERT INTO `users` (`id`, `first_name`, `middle_name`, `last_name`, `email`, `password_hash`, `role`, `phone`, `address`, `status`, `member_since`, `created_at`, `updated_at`) VALUES
	(1, 'Balingasag Library', 'Municipal', 'Admin', 'admin@balingasag.gov.ph', '$2y$12$26EqVpLdKhrMtdl6PKzzqOel/DuOYtX3pxp32bYR2rVpL.FifXzE6', 'admin', '09171234567', 'Municipal Hall, Balingasag, Misamis Oriental', 'active', '2026-02-24', '2026-05-24 13:47:17', '2026-05-24 13:47:17'),
	(2, 'Juan', 'Ponce', 'Dela Cruz', 'member@balingasag.gov.ph', '$2y$12$pdk6xQ8z8haiEjYOU73ZzecVpzvkc8DtooQhvgWRscaxE/9nvOctW', 'member', '09187654321', 'Barangay 15, Balingasag, Misamis Oriental', 'active', '2026-02-24', '2026-05-24 13:47:17', '2026-05-24 13:48:27'),
	(3, 'Maria', 'Clara', 'Santos', 'maria@gmail.com', '$2y$12$SjGBHnp9NgbEHpuGl.ctSek0GlY4JKt9pGcKf/FkDO7MJSOi514qa', 'member', '09223344556', 'Barangay Waterfall, Balingasag, Misamis Oriental', 'active', '2026-02-24', '2026-05-24 13:47:17', '2026-05-24 13:47:17');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

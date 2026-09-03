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
  `status` enum('available','unavailable') COLLATE utf8mb4_unicode_ci DEFAULT 'available',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `isbn` (`isbn`),
  KEY `idx_books_isbn` (`isbn`),
  KEY `idx_books_category` (`category`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table balingasag_library.books: ~9 rows (approximately)
INSERT INTO `books` (`id`, `title`, `author`, `isbn`, `category`, `year`, `description`, `cover_image`, `total_copies`, `available_copies`, `status`, `created_at`) VALUES
	(2, 'The Alchemist', 'Paulo Coelho', '9780061122415', 'Fiction', 2006, 'In this highly acclaimed fiction volume, &quot;The Alchemist&quot;, published in 2006, the renowned author Paulo Coelho presents a brilliantly researched and captivating perspective. Known for its engaging prose and stunning emotional resonance, the book leads readers through an unforgettable journey of learning and personal growth. A highly sought-after reference in our catalog.', 'https://covers.openlibrary.org/b/id/15121528-L.jpg', 6, 6, 'available', '2026-05-24 01:57:47'),
	(3, 'To Kill a Mockingbird', 'Harper Lee', '9780060935467', 'Fiction', 2016, '', 'https://covers.openlibrary.org/b/id/15153357-L.jpg', 1, 1, 'available', '2026-05-24 01:58:57'),
	(4, 'Nineteen Eighty-Four', 'George Orwell', '9780451524935', 'Fiction', 1993, 'An immersive and exquisitely crafted fiction classic, &quot;Nineteen Eighty-Four&quot; by George Orwell (1993) stands as a stellar contribution to modern literature. The book skillfully weaves elements of suspense, discovery, and philosophy to create a memorable and highly recommended reading experience. An essential volume for the Balingasag Municipal Public Library shelves.', 'https://covers.openlibrary.org/b/id/12054527-L.jpg', 6, 6, 'available', '2026-05-24 02:01:33'),
	(5, 'The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 'Fiction', 2021, '&quot;The Great Gatsby&quot; is a compelling fiction work written by the distinguished author F. Scott Fitzgerald in 2021. Set against a richly woven backdrop, this masterpiece explores the intricate human condition, challenging readers&#039; perceptions through its powerful storytelling. An exceptional addition to the library, it remains highly recommended for anyone interested in deep, thought-provoking literature.', 'https://covers.openlibrary.org/b/id/14314120-L.jpg', 6, 5, 'available', '2026-05-24 02:01:52'),
	(6, 'The Hobbit', 'J.R.R. Tolkien', '9780547928227', 'Biography', 2012, '&quot;The Hobbit&quot; is a compelling fiction work written by the distinguished author J.R.R. Tolkien in 2012. Set against a richly woven backdrop, this masterpiece explores the intricate human condition, challenging readers&#039; perceptions through its powerful storytelling. An exceptional addition to the library, it remains highly recommended for anyone interested in deep, thought-provoking literature.', 'https://covers.openlibrary.org/b/id/12003329-L.jpg', 1, 1, 'available', '2026-05-24 02:26:36'),
	(7, 'The Catcher in the Rye', 'J. D. Salinger, Shao jia yun', '9780316769488', 'Fiction', 1991, 'Written by the acclaimed author J. D. Salinger, Shao jia yun and published in 1991, this outstanding fiction book, &quot;The Catcher in the Rye&quot;, delivers a masterful narrative filled with depth and intellect. It delves into profound themes and captivating character development that keeps readers engrossed from the very first page. A landmark text in its genre, perfect for local students and avid readers alike.', 'https://covers.openlibrary.org/b/id/15172531-L.jpg', 1, 1, 'available', '2026-05-24 02:31:09'),
	(8, 'Lord of the flies', 'William Golding', '9780399501487', 'Fiction', 1954, 'An immersive and exquisitely crafted fiction classic, &quot;Lord of the flies&quot; by William Golding (1954) stands as a stellar contribution to modern literature. The book skillfully weaves elements of suspense, discovery, and philosophy to create a memorable and highly recommended reading experience. An essential volume for the Balingasag Municipal Public Library shelves.', 'https://covers.openlibrary.org/b/id/8231827-L.jpg', 1, 1, 'available', '2026-05-24 02:31:30'),
	(9, 'Fahrenheit 451', 'Ray Bradbury', '9781451673319', 'Fiction', 2013, 'In this highly acclaimed fiction volume, &quot;Fahrenheit 451&quot;, published in 2013, the renowned author Ray Bradbury presents a brilliantly researched and captivating perspective. Known for its engaging prose and stunning emotional resonance, the book leads readers through an unforgettable journey of learning and personal growth. A highly sought-after reference in our catalog.', 'https://covers.openlibrary.org/b/id/12460599-L.jpg', 1, 0, 'unavailable', '2026-05-24 02:31:47'),
	(10, 'Pride and Prejudice', 'Jane Austen', '9780141439518', 'Fiction', 2003, 'Written by the acclaimed author Jane Austen and published in 2003, this outstanding fiction book, &amp;quot;Pride and Prejudice&amp;quot;, delivers a masterful narrative filled with depth and intellect. It delves into profound themes and captivating character development that keeps readers engrossed from the very first page. A landmark text in its genre, perfect for local students and avid readers alike.', 'https://covers.openlibrary.org/b/id/12645114-L.jpg', 5, 5, 'available', '2026-05-24 02:32:10'),
	(11, 'The Lord Of The Rings', 'J.R.R. Tolkien', '9780544003415', 'Fiction', 2012, 'In this highly acclaimed fiction volume, &quot;The Lord Of The Rings&quot;, published in 2012, the renowned author J.R.R. Tolkien presents a brilliantly researched and captivating perspective. Known for its engaging prose and stunning emotional resonance, the book leads readers through an unforgettable journey of learning and personal growth. A highly sought-after reference in our catalog.', 'https://covers.openlibrary.org/b/id/13911921-L.jpg', 1, 1, 'available', '2026-05-24 03:43:17'),
	(12, 'Animal Farm', 'George Orwell', '9780451526342', 'Fiction', 1996, '&amp;quot;Animal Farm&amp;quot; is a compelling fiction work written by the distinguished author George Orwell in 1996. Set against a richly woven backdrop, this masterpiece explores the intricate human condition, challenging readers&amp;#039; perceptions through its powerful storytelling. An exceptional addition to the library, it remains highly recommended for anyone interested in deep, thought-provoking literature.', '', 4, 3, 'available', '2026-05-24 03:48:25'),
	(13, 'The Da Vinci Code', 'Dan Brown', '9780307474278', 'Science', 2009, 'In this highly acclaimed fiction volume, &quot;The Da Vinci Code&quot;, published in 2009, the renowned author Dan Brown presents a brilliantly researched and captivating perspective. Known for its engaging prose and stunning emotional resonance, the book leads readers through an unforgettable journey of learning and personal growth. A highly sought-after reference in our catalog.', 'https://covers.openlibrary.org/b/id/6301424-L.jpg', 4, 4, 'available', '2026-05-24 03:48:53'),
	(14, 'The Book Thief', 'Markus Zusak', '9780375842207', 'Fiction', 2007, 'Written by the acclaimed author Markus Zusak and published in 2007, this outstanding fiction book, &quot;The Book Thief&quot;, delivers a masterful narrative filled with depth and intellect. It delves into profound themes and captivating character development that keeps readers engrossed from the very first page. A landmark text in its genre, perfect for local students and avid readers alike.', 'https://covers.openlibrary.org/b/id/14551245-L.jpg', 1, 1, 'available', '2026-05-24 04:01:34'),
	(15, 'The Hunger Games', 'Suzanne Collins', '9780439023481', 'Fiction', 2008, 'In this highly acclaimed fiction volume, &quot;The Hunger Games&quot;, published in 2008, the renowned author Suzanne Collins presents a brilliantly researched and captivating perspective. Known for its engaging prose and stunning emotional resonance, the book leads readers through an unforgettable journey of learning and personal growth. A highly sought-after reference in our catalog.', 'https://covers.openlibrary.org/b/id/15167646-L.jpg', 4, 4, 'available', '2026-05-24 04:01:56'),
	(16, 'Harry Potter and the Sorcerer&#039;s Stone', 'J. K. Rowling', '9780590353427', 'History', 1999, 'Written by the acclaimed author J. K. Rowling and published in 1999, this outstanding history book, &quot;Harry Potter and the Sorcerer&#039;s Stone&quot;, delivers a masterful narrative filled with depth and intellect. It delves into profound themes and captivating character development that keeps readers engrossed from the very first page. A landmark text in its genre, perfect for local students and avid readers alike.', 'https://covers.openlibrary.org/b/id/15160586-L.jpg', 4, 4, 'available', '2026-05-24 04:02:20'),
	(17, 'Any easy intimacy', 'Jeffrey Brown', '9781891830716', 'Biography', 2007, 'Written by the acclaimed author Jeffrey Brown and published in 2007, this outstanding biography book, &quot;Any easy intimacy&quot;, delivers a masterful narrative filled with depth and intellect. It delves into profound themes and captivating character development that keeps readers engrossed from the very first page. A landmark text in its genre, perfect for local students and avid readers alike.', '', 1, 1, 'available', '2026-05-24 05:33:10'),
	(18, 'Apocrypha now', 'Mark Russell', '9781603093699', 'Fiction', 2016, 'Written by the acclaimed author Mark Russell and published in 2016, this outstanding fiction book, &quot;Apocrypha now&quot;, delivers a masterful narrative filled with depth and intellect. It delves into profound themes and captivating character development that keeps readers engrossed from the very first page. A landmark text in its genre, perfect for local students and avid readers alike.', 'https://covers.openlibrary.org/b/id/14309033-L.jpg', 1, 1, 'available', '2026-05-24 05:33:29'),
	(19, 'Bacchus', 'Eddie Campbell', '9781603090261', 'Fiction', 2017, 'An immersive and exquisitely crafted fiction classic, &quot;Bacchus&quot; by Eddie Campbell (2017) stands as a stellar contribution to modern literature. The book skillfully weaves elements of suspense, discovery, and philosophy to create a memorable and highly recommended reading experience. An essential volume for the Balingasag Municipal Public Library shelves.', 'https://covers.openlibrary.org/b/id/12625642-L.jpg', 1, 1, 'available', '2026-05-24 05:33:44'),
	(20, 'Better Place', 'Duane Murray, Shawn Daley', '9781603094955', 'Fiction', 2021, 'An immersive and exquisitely crafted fiction classic, &quot;Better Place&quot; by Duane Murray, Shawn Daley (2021) stands as a stellar contribution to modern literature. The book skillfully weaves elements of suspense, discovery, and philosophy to create a memorable and highly recommended reading experience. An essential volume for the Balingasag Municipal Public Library shelves.', 'https://covers.openlibrary.org/b/id/11996578-L.jpg', 6, 6, 'available', '2026-05-24 05:34:29'),
	(21, 'The Delicacy', 'James Albon', '9781603094924', 'Fiction', 2021, '&quot;The Delicacy&quot; is a compelling fiction work written by the distinguished author James Albon in 2021. Set against a richly woven backdrop, this masterpiece explores the intricate human condition, challenging readers&#039; perceptions through its powerful storytelling. An exceptional addition to the library, it remains highly recommended for anyone interested in deep, thought-provoking literature.', 'https://covers.openlibrary.org/b/id/11996561-L.jpg', 5, 5, 'available', '2026-05-24 05:34:43'),
	(22, 'Funny Things', 'Luca Debus, Francesco Matteuzzi', '9781603095266', 'Fiction', 2023, 'An immersive and exquisitely crafted fiction classic, &quot;Funny Things&quot; by Luca Debus, Francesco Matteuzzi (2023) stands as a stellar contribution to modern literature. The book skillfully weaves elements of suspense, discovery, and philosophy to create a memorable and highly recommended reading experience. An essential volume for the Balingasag Municipal Public Library shelves.', 'https://covers.openlibrary.org/b/id/14419963-L.jpg', 4, 4, 'available', '2026-05-24 05:35:18'),
	(23, 'Incredible Change-Bots Two Point Something Something', 'Jeffrey Brown', '9781603093484', 'Fiction', 2017, 'An immersive and exquisitely crafted fiction classic, &quot;Incredible Change-Bots Two Point Something Something&quot; by Jeffrey Brown (2017) stands as a stellar contribution to modern literature. The book skillfully weaves elements of suspense, discovery, and philosophy to create a memorable and highly recommended reading experience. An essential volume for the Balingasag Municipal Public Library shelves.', 'https://covers.openlibrary.org/b/id/11651774-L.jpg', 1, 0, 'unavailable', '2026-05-24 05:35:34'),
	(24, 'Sapiens A brief Story of Human Kind', 'Yuval Noah Harari', '9780062316097', 'Technology', 2011, 'In this highly acclaimed technology volume, &quot;Sapiens A brief Story of Human Kind&quot;, published in 2011, the renowned author Yuval Noah Harari presents a brilliantly researched and captivating perspective. Known for its engaging prose and stunning emotional resonance, the book leads readers through an unforgettable journey of learning and personal growth. A highly sought-after reference in our catalog.', 'https://covers.openlibrary.org/b/id/14369194-L.jpg', 1, 1, 'available', '2026-05-24 05:36:38'),
	(25, 'The Notebook (The Notebook #1)', 'Nicholas Sparks', '9780446605236', 'Fiction', 2004, 'Written by the acclaimed author Nicholas Sparks and published in 2004, this outstanding fiction book, &quot;The Notebook (The Notebook #1)&quot;, delivers a masterful narrative filled with depth and intellect. It delves into profound themes and captivating character development that keeps readers engrossed from the very first page. A landmark text in its genre, perfect for local students and avid readers alike.', 'https://covers.openlibrary.org/b/id/8155447-L.jpg', 5, 5, 'available', '2026-05-24 05:38:21'),
	(26, 'Me Before You', 'Jojo Moyes', '9780143124542', 'Fiction', 2013, '&quot;Me Before You&quot; is a compelling fiction work written by the distinguished author Jojo Moyes in 2013. Set against a richly woven backdrop, this masterpiece explores the intricate human condition, challenging readers&#039; perceptions through its powerful storytelling. An exceptional addition to the library, it remains highly recommended for anyone interested in deep, thought-provoking literature.', '', 4, 4, 'available', '2026-05-24 05:38:41'),
	(27, 'Eleanor Oliphant Is Completely Fine: A Novel', 'Gail Honeyman', '9780735220690', 'Fiction', 2018, 'In this highly acclaimed fiction volume, &quot;Eleanor Oliphant Is Completely Fine: A Novel&quot;, published in 2018, the renowned author Gail Honeyman presents a brilliantly researched and captivating perspective. Known for its engaging prose and stunning emotional resonance, the book leads readers through an unforgettable journey of learning and personal growth. A highly sought-after reference in our catalog.', 'https://covers.openlibrary.org/b/id/8588084-L.jpg', 4, 4, 'available', '2026-05-24 05:38:57'),
	(28, 'Never Let Me Go', 'Kazuo Ishiguro', '9781400078776', 'Fiction', 2006, 'In this highly acclaimed fiction volume, &quot;Never Let Me Go&quot;, published in 2006, the renowned author Kazuo Ishiguro presents a brilliantly researched and captivating perspective. Known for its engaging prose and stunning emotional resonance, the book leads readers through an unforgettable journey of learning and personal growth. A highly sought-after reference in our catalog.', 'https://covers.openlibrary.org/b/id/13160732-L.jpg', 5, 5, 'available', '2026-05-24 05:39:14'),
	(29, 'The Stand', 'Stephen King', '9780307743688', 'Fiction', 2019, '&quot;The Stand&quot; is a compelling fiction work written by the distinguished author Stephen King in 2019. Set against a richly woven backdrop, this masterpiece explores the intricate human condition, challenging readers&#039; perceptions through its powerful storytelling. An exceptional addition to the library, it remains highly recommended for anyone interested in deep, thought-provoking literature.', '', 4, 4, 'available', '2026-05-24 05:39:34'),
	(30, 'The Giver', 'Lois Lowry', '9780544336261', 'Fiction', 2014, 'Written by the acclaimed author Lois Lowry and published in 2014, this outstanding fiction book, &quot;The Giver&quot;, delivers a masterful narrative filled with depth and intellect. It delves into profound themes and captivating character development that keeps readers engrossed from the very first page. A landmark text in its genre, perfect for local students and avid readers alike.', 'https://covers.openlibrary.org/b/id/8352502-L.jpg', 3, 3, 'available', '2026-05-24 05:39:55'),
	(31, 'The Children of Men', 'P. D. James', '9780307275431', 'Fiction', 2006, '&quot;The Children of Men&quot; is a compelling fiction work written by the distinguished author P. D. James in 2006. Set against a richly woven backdrop, this masterpiece explores the intricate human condition, challenging readers&#039; perceptions through its powerful storytelling. An exceptional addition to the library, it remains highly recommended for anyone interested in deep, thought-provoking literature.', 'https://covers.openlibrary.org/b/id/167347-L.jpg', 4, 4, 'available', '2026-05-24 05:40:09'),
	(32, 'Principles', 'Ray Dalio', '9781501124020', 'Fiction', 2017, '&quot;Principles&quot; is a compelling fiction work written by the distinguished author Ray Dalio in 2017. Set against a richly woven backdrop, this masterpiece explores the intricate human condition, challenging readers&#039; perceptions through its powerful storytelling. An exceptional addition to the library, it remains highly recommended for anyone interested in deep, thought-provoking literature.', 'https://covers.openlibrary.org/b/id/8315355-L.jpg', 1, 1, 'available', '2026-05-24 05:40:25'),
	(33, 'Zen and the Art of Motorcycle Maintenance', 'Robert M. Pirsig', '9780060589462', 'Fiction', 2006, 'In this highly acclaimed fiction volume, &quot;Zen and the Art of Motorcycle Maintenance&quot;, published in 2006, the renowned author Robert M. Pirsig presents a brilliantly researched and captivating perspective. Known for its engaging prose and stunning emotional resonance, the book leads readers through an unforgettable journey of learning and personal growth. A highly sought-after reference in our catalog.', 'https://covers.openlibrary.org/b/id/31248-L.jpg', 1, 1, 'available', '2026-05-24 05:40:36'),
	(34, 'The Hard Thing About Hard Things', 'Ben Horowitz', '9780062273208', 'Fiction', 2014, 'An immersive and exquisitely crafted fiction classic, &quot;The Hard Thing About Hard Things&quot; by Ben Horowitz (2014) stands as a stellar contribution to modern literature. The book skillfully weaves elements of suspense, discovery, and philosophy to create a memorable and highly recommended reading experience. An essential volume for the Balingasag Municipal Public Library shelves.', 'https://covers.openlibrary.org/b/id/15051998-L.jpg', 1, 1, 'available', '2026-05-24 05:40:53');

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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table balingasag_library.notifications: ~5 rows (approximately)
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES
	(1, 1, 'Book Borrowed Successfully', 'You have borrowed "The Great Gatsby". Please return it on or before Jun 07, 2026 to avoid late charges.', 'due_reminder', 1, '2026-05-24 02:02:35'),
	(2, 1, 'Book Borrowed Successfully', 'You have borrowed "Nineteen Eighty-Four". Please return it on or before Jun 07, 2026 to avoid late charges.', 'due_reminder', 1, '2026-05-24 02:02:44'),
	(3, 1, 'Book Borrowed Successfully', 'You have borrowed "To Kill a Mockingbird". Please return it on or before Jun 07, 2026 to avoid late charges.', 'due_reminder', 1, '2026-05-24 02:02:48'),
	(4, 1, 'Book Returned Successfully', 'Thank you! The book "To Kill a Mockingbird" was returned in good order.', 'announcement', 1, '2026-05-24 02:28:00'),
	(5, 1, 'Book Borrowed Successfully', 'You have borrowed "The Alchemist". Please return it on or before Jun 07, 2026 to avoid late charges.', 'due_reminder', 1, '2026-05-24 02:28:15'),
	(6, 1, 'Book Returned Successfully', 'Thank you! The book "The Alchemist" was returned in good order.', 'announcement', 1, '2026-05-24 04:37:26'),
	(7, 1, 'Book Returned Successfully', 'Thank you! The book "Nineteen Eighty-Four" was returned in good order.', 'announcement', 0, '2026-05-24 04:38:39'),
	(8, 4, 'Book Borrowed Successfully', 'You have borrowed "Incredible Change-Bots Two Point Something Something". Please return it on or before Jun 07, 2026 to avoid late charges.', 'due_reminder', 0, '2026-05-24 05:48:53'),
	(9, 4, 'Book Borrowed Successfully', 'You have borrowed "Fahrenheit 451". Please return it on or before Jun 07, 2026 to avoid late charges.', 'due_reminder', 0, '2026-05-24 05:48:56'),
	(10, 4, 'Book Borrowed Successfully', 'You have borrowed "Animal Farm". Please return it on or before Jun 07, 2026 to avoid late charges.', 'due_reminder', 0, '2026-05-24 05:49:00');

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
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table balingasag_library.refresh_tokens: ~1 rows (approximately)

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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table balingasag_library.transactions: ~4 rows (approximately)
INSERT INTO `transactions` (`id`, `transaction_id`, `user_id`, `book_id`, `borrow_date`, `due_date`, `return_date`, `renewals`, `status`, `created_at`) VALUES
	(1, 'TXN-20260524-6BA27', 1, 5, '2026-05-24', '2026-06-07', NULL, 0, 'active', '2026-05-24 02:02:35'),
	(2, 'TXN-20260524-01155', 1, 4, '2026-05-24', '2026-06-07', '2026-05-24', 0, 'completed', '2026-05-24 02:02:44'),
	(3, 'TXN-20260524-E9F21', 1, 3, '2026-05-24', '2026-06-07', '2026-05-24', 0, 'completed', '2026-05-24 02:02:48'),
	(4, 'TXN-20260524-F1D35', 1, 2, '2026-05-24', '2026-06-07', '2026-05-24', 0, 'completed', '2026-05-24 02:28:15'),
	(5, 'TXN-20260524-6F22C', 4, 23, '2026-05-24', '2026-06-07', NULL, 0, 'active', '2026-05-24 05:48:53'),
	(6, 'TXN-20260524-CB1C3', 4, 9, '2026-05-24', '2026-06-07', NULL, 0, 'active', '2026-05-24 05:48:56'),
	(7, 'TXN-20260524-3E513', 4, 12, '2026-05-24', '2026-06-07', NULL, 0, 'active', '2026-05-24 05:49:00');

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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table balingasag_library.users: ~3 rows (approximately)
INSERT INTO `users` (`id`, `first_name`, `middle_name`, `last_name`, `email`, `password_hash`, `role`, `phone`, `address`, `status`, `member_since`, `created_at`, `updated_at`) VALUES
	(1, 'Raymark', NULL, 'Acierto', 'mark@gmail.com', '$2y$12$PVpCCStfvVATYnt/M6ASkeZ1ECyOX2Q4MKSjIQGbwEzNJoN1SSVx.', 'member', '09265152953', 'Brgy 2', 'active', '2026-05-24', '2026-05-23 16:44:48', '2026-05-24 04:20:42'),
	(2, 'Raymark', NULL, 'Acierto', 'admin@gmail.com', '$2y$12$/Y9FTOVQ0hZyIBNdeuAxreew3LpDSLZW8I.0hRgMvmtQNU6cr4yYS', 'admin', '1234123123', '123123adad', 'active', '2026-05-24', '2026-05-23 16:45:39', '2026-05-23 17:22:12'),
	(3, 'Balingasag Library', 'Municipal', 'Admin', 'admin@balingasag.gov.ph', '$2y$12$0rNVU./hMHVL19h.AC0YPOqJ.q011EHpAemX/OAiP08lW2SMi7yK2', 'admin', '09171234567', 'Municipal Hall, Balingasag', 'active', '2026-05-24', '2026-05-23 17:22:12', '2026-05-23 17:22:12'),
	(4, 'Marites', 'Valledor', 'Acierto', 'marites@gmail.com', '$2y$12$jk6lBMzj3vi6b6V1lLQ1WemLZStdIDSyiqYsuu7ZGXOMewViXIXG2', 'member', '09265152952', 'San Isidro', 'active', '2026-05-24', '2026-05-24 05:48:11', '2026-05-24 05:48:11'),
	(5, 'Raymark Jay', 'Valledor', 'Acierto', 'test1@gmail.com', '$2y$12$MLMaNuIERirCt0ouLy0jve7qagF0gSa.rQjN/YZEKpZme1iHFFgKu', 'member', '09265152953', 'Brgy 2', 'active', '2026-05-24', '2026-05-24 06:25:12', '2026-05-24 06:25:30');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

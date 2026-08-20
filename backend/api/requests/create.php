<?php
// backend/api/requests/create.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/activity_logger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed. Only POST is supported.', 405);
}

$user = JWT::requireAuth();
$input = Utils::getJsonInput();

$type = $input['type'] ?? '';
if (!in_array($type, ['borrowing', 'archive', 'acquisition'])) {
    Response::badRequest('Invalid request type. Must be borrowing, archive, or acquisition.');
}

$requestId = 'REQ-' . strtoupper(substr($type, 0, 3)) . '-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -5));

try {
    $db = Database::getConnection();

    if ($type === 'borrowing') {
        $bookId = $input['book_id'] ?? null;
        $reason = $input['reason'] ?? 'Member book borrowing request';
        $schoolIdImage = $input['school_id_image'] ?? null;

        if (!$bookId) {
            Response::badRequest('Please select a valid book to borrow.');
        }

        // Verify book availability
        $stmtBook = $db->prepare("SELECT id, title, available_copies, status FROM books WHERE id = :id AND deleted_at IS NULL");
        $stmtBook->execute([':id' => $bookId]);
        $book = $stmtBook->fetch(PDO::FETCH_ASSOC);

        if (!$book) {
            Response::notFound('Selected book not found.');
        }
        if ($book['available_copies'] <= 0 || $book['status'] !== 'available') {
            Response::badRequest('This book currently has no available copies. You may reserve it instead.');
        }

        // Verify member has no pending request for this exact book
        $stmtDup = $db->prepare("SELECT id FROM requests WHERE user_id = :uid AND book_id = :bid AND type = 'borrowing' AND status = 'pending'");
        $stmtDup->execute([':uid' => $user['id'], ':bid' => $bookId]);
        if ($stmtDup->fetch()) {
            Response::badRequest('You already have a pending borrow request for this book.');
        }

        // Verify member borrowing limit
        $stmtBorrowCount = $db->prepare("SELECT COUNT(*) FROM transactions WHERE user_id = :uid AND status IN ('active', 'overdue')");
        $stmtBorrowCount->execute([':uid' => $user['id']]);
        $activeLoans = (int)$stmtBorrowCount->fetchColumn();

        $maxLoans = 3;
        try {
            $limitSetting = $db->query("SELECT setting_value FROM system_settings WHERE setting_key = 'borrowing_limit'")->fetchColumn();
            if ($limitSetting) $maxLoans = (int)$limitSetting;
        } catch (Exception $e) {}

        if ($activeLoans >= $maxLoans) {
            Response::badRequest("You have reached the maximum allowed active loans ($maxLoans books). Please return borrowed materials before submitting new requests.");
        }

        // Insert request
        $stmt = $db->prepare("
            INSERT INTO requests (request_id, type, user_id, book_id, title, author, reason, school_id_image, status)
            VALUES (:req_id, 'borrowing', :uid, :bid, :title, :author, :reason, :id_img, 'pending')
        ");
        $stmt->execute([
            ':req_id' => $requestId,
            ':uid' => $user['id'],
            ':bid' => $bookId,
            ':title' => $book['title'],
            ':author' => $book['author'] ?? '',
            ':reason' => $reason,
            ':id_img' => $schoolIdImage
        ]);

        logActivity(
            $user['id'],
            'borrow_request',
            'Requests',
            "Submitted borrow request ($requestId) for book: {$book['title']}"
        );

        Response::created(['request_id' => $requestId], 'Borrow request submitted successfully! Library staff will review your request.');

    } elseif ($type === 'archive') {
        // Admin or Super Admin submitting archive request
        $bookId = $input['book_id'] ?? null;
        $reason = trim($input['reason'] ?? '');

        if (!$bookId) {
            Response::badRequest('Book ID is required for archive request.');
        }
        if (empty($reason)) {
            Response::badRequest('Please provide a reason or remarks for archiving this book.');
        }

        $stmtBook = $db->prepare("SELECT id, title, author FROM books WHERE id = :id");
        $stmtBook->execute([':id' => $bookId]);
        $book = $stmtBook->fetch(PDO::FETCH_ASSOC);

        if (!$book) {
            Response::notFound('Book not found.');
        }

        // If Super Admin, they can directly archive or create request
        $stmt = $db->prepare("
            INSERT INTO requests (request_id, type, user_id, book_id, title, author, reason, status)
            VALUES (:req_id, 'archive', :uid, :bid, :title, :author, :reason, 'pending')
        ");
        $stmt->execute([
            ':req_id' => $requestId,
            ':uid' => $user['id'],
            ':bid' => $bookId,
            ':title' => $book['title'],
            ':author' => $book['author'],
            ':reason' => $reason
        ]);

        logActivity(
            $user['id'],
            'archive_request',
            'Requests',
            "Submitted archive request ($requestId) for book: {$book['title']}. Reason: $reason"
        );

        Response::created(['request_id' => $requestId], 'Archive request submitted for Super Admin review.');

    } elseif ($type === 'acquisition') {
        // Member or Staff submitting acquisition suggestion
        $title = trim($input['title'] ?? '');
        $author = trim($input['author'] ?? '');
        $reason = trim($input['reason'] ?? '');

        if (empty($title)) {
            Response::badRequest('Book title is required for acquisition request.');
        }

        $stmt = $db->prepare("
            INSERT INTO requests (request_id, type, user_id, title, author, reason, status)
            VALUES (:req_id, 'acquisition', :uid, :title, :author, :reason, 'pending')
        ");
        $stmt->execute([
            ':req_id' => $requestId,
            ':uid' => $user['id'],
            ':title' => $title,
            ':author' => $author,
            ':reason' => $reason
        ]);

        logActivity(
            $user['id'],
            'acquisition_request',
            'Requests',
            "Submitted acquisition request ($requestId) for title: $title by $author"
        );

        Response::created(['request_id' => $requestId], 'Book acquisition request submitted to library management!');
    }

} catch (PDOException $e) {
    Response::error('Database error: ' . $e->getMessage());
}

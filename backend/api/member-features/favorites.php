<?php
// backend/api/member-features/favorites.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/activity_logger.php';

$user = JWT::requireAuth();
$db = Database::getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $db->prepare("
            SELECT f.id AS fav_id, f.created_at AS favorited_at, b.*
            FROM favorites f
            JOIN books b ON f.book_id = b.id
            WHERE f.user_id = :uid AND b.deleted_at IS NULL
            ORDER BY f.created_at DESC
        ");
        $stmt->execute([':uid' => $user['id']]);
        $favorites = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success($favorites, 'Favorites fetched successfully.');
    } catch (PDOException $e) {
        Response::error('Database error: ' . $e->getMessage());
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = Utils::getJsonInput();
    $bookId = $input['book_id'] ?? null;

    if (!$bookId) {
        Response::badRequest('Book ID is required.');
    }

    try {
        // Check if already favorited
        $stmtCheck = $db->prepare("SELECT id FROM favorites WHERE user_id = :uid AND book_id = :bid");
        $stmtCheck->execute([':uid' => $user['id'], ':bid' => $bookId]);
        $existing = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            // Unfavorite
            $stmtDel = $db->prepare("DELETE FROM favorites WHERE id = :id");
            $stmtDel->execute([':id' => $existing['id']]);
            $isFav = false;
            $msg = 'Book removed from favorites.';
        } else {
            // Favorite
            $stmtAdd = $db->prepare("INSERT INTO favorites (user_id, book_id) VALUES (:uid, :bid)");
            $stmtAdd->execute([':uid' => $user['id'], ':bid' => $bookId]);
            $isFav = true;
            $msg = 'Book added to your favorite reading list!';

            logActivity(
                $user['id'],
                'favorite_book',
                'Catalog',
                "Added book ID $bookId to favorites."
            );
        }

        Response::success(['is_favorite' => $isFav], $msg);

    } catch (PDOException $e) {
        Response::error('Database error: ' . $e->getMessage());
    }
} else {
    Response::error('Method not allowed.', 405);
}

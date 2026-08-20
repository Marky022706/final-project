<?php
// backend/api/member-features/saved_searches.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';

$user = JWT::requireAuth();
$db = Database::getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $db->prepare("SELECT * FROM saved_searches WHERE user_id = :uid ORDER BY created_at DESC");
        $stmt->execute([':uid' => $user['id']]);
        $searches = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decode JSON filters
        foreach ($searches as &$s) {
            $s['filters'] = json_decode($s['filters_json'], true) ?: [];
        }

        Response::success($searches, 'Saved searches fetched successfully.');
    } catch (PDOException $e) {
        Response::error('Database error: ' . $e->getMessage());
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = Utils::getJsonInput();
    $name = trim($input['search_name'] ?? '');
    $filters = $input['filters'] ?? [];

    if (empty($name)) {
        Response::badRequest('Please provide a name for this saved search.');
    }

    try {
        $stmt = $db->prepare("
            INSERT INTO saved_searches (user_id, search_name, filters_json)
            VALUES (:uid, :name, :json)
        ");
        $stmt->execute([
            ':uid' => $user['id'],
            ':name' => $name,
            ':json' => json_encode($filters)
        ]);

        Response::created(['id' => $db->lastInsertId()], 'Search query saved successfully!');
    } catch (PDOException $e) {
        Response::error('Database error: ' . $e->getMessage());
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        Response::badRequest('Search ID required.');
    }

    try {
        $stmt = $db->prepare("DELETE FROM saved_searches WHERE id = :id AND user_id = :uid");
        $stmt->execute([':id' => $id, ':uid' => $user['id']]);
        Response::success(null, 'Saved search removed.');
    } catch (PDOException $e) {
        Response::error('Database error: ' . $e->getMessage());
    }
} else {
    Response::error('Method not allowed.', 405);
}

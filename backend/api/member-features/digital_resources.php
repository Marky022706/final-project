<?php
// backend/api/member-features/digital_resources.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/activity_logger.php';

$user = JWT::requireAuth();
$db = Database::getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $search = trim($_GET['search'] ?? '');
    $category = trim($_GET['category'] ?? '');

    try {
        $where = [];
        $params = [];

        if (!empty($search)) {
            $where[] = "(title LIKE :search OR author LIKE :search OR description LIKE :search)";
            $params[':search'] = "%$search%";
        }
        if (!empty($category)) {
            $where[] = "category = :cat";
            $params[':cat'] = $category;
        }

        $whereClause = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";

        $stmt = $db->prepare("SELECT * FROM digital_resources $whereClause ORDER BY title ASC");
        $stmt->execute($params);
        $resources = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch categories list
        $categories = $db->query("SELECT DISTINCT category FROM digital_resources ORDER BY category ASC")->fetchAll(PDO::FETCH_COLUMN);

        Response::success([
            'resources' => $resources,
            'categories' => $categories
        ], 'Digital resources fetched successfully.');

    } catch (PDOException $e) {
        Response::error('Database error: ' . $e->getMessage());
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Record digital reading access
    $input = Utils::getJsonInput();
    $resourceId = $input['resource_id'] ?? null;
    $duration = (int)($input['duration_seconds'] ?? 60);

    if (!$resourceId) {
        Response::badRequest('Resource ID is required.');
    }

    try {
        $stmtRes = $db->prepare("SELECT title FROM digital_resources WHERE id = :id");
        $stmtRes->execute([':id' => $resourceId]);
        $res = $stmtRes->fetch(PDO::FETCH_ASSOC);

        if ($res) {
            $stmtHist = $db->prepare("
                INSERT INTO digital_reading_history (user_id, resource_id, read_duration_seconds)
                VALUES (:uid, :rid, :dur)
            ");
            $stmtHist->execute([
                ':uid' => $user['id'],
                ':rid' => $resourceId,
                ':dur' => $duration
            ]);

            logActivity(
                $user['id'],
                'digital_reading',
                'DigitalLibrary',
                "Accessed digital reading material: {$res['title']}"
            );
        }

        Response::success(null, 'Digital reading session recorded.');

    } catch (PDOException $e) {
        Response::error('Database error: ' . $e->getMessage());
    }
} else {
    Response::error('Method not allowed.', 405);
}

<?php
// backend/api/announcements/create.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/activity_logger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

$user = JWT::requireRole(['admin', 'superadmin']);
$input = Utils::getJsonInput();

$title = trim($input['title'] ?? '');
$content = trim($input['content'] ?? '');
$category = trim($input['category'] ?? 'General');
$expiresAt = !empty($input['expires_at']) ? $input['expires_at'] : null;

if (empty($title) || empty($content)) {
    Response::badRequest('Title and content are required.');
}

try {
    $db = Database::getConnection();

    $stmt = $db->query("SHOW COLUMNS FROM announcements WHERE Field = 'id'");
    $annIdCol = $stmt->fetch(PDO::FETCH_ASSOC);
    $hasAutoInc = strpos($annIdCol['Extra'] ?? '', 'auto_increment') !== false;

    $fields = ['title', 'content', 'category', 'author_id', 'published_at', 'expires_at', 'status'];
    $placeholders = [':title', ':content', ':category', ':author', 'NOW()', ':expires', "'active'"];
    $params = [
        ':title' => $title,
        ':content' => $content,
        ':category' => $category,
        ':author' => $user['id'],
        ':expires' => $expiresAt
    ];

    if (!$hasAutoInc) {
        $fields[] = 'id';
        $placeholders[] = ':id';
        $params[':id'] = 'ANN-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -5));
    }

    $sql = "INSERT INTO announcements (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $placeholders) . ")";
    $stmtInsert = $db->prepare($sql);
    $stmtInsert->execute($params);

    logActivity(
        $user['id'],
        'create_announcement',
        'Announcements',
        "Published new announcement: '$title' in category $category"
    );

    Response::created(null, 'Announcement published successfully!');

} catch (PDOException $e) {
    Response::error('Database error: ' . $e->getMessage());
}

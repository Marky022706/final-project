<?php
// backend/api/settings/update.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/activity_logger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed. Only POST is supported.', 405);
}

// Super Admin only
$user = JWT::requireSuperAdmin();
$input = Utils::getJsonInput();

$settings = $input['settings'] ?? [];
if (empty($settings) || !is_array($settings)) {
    Response::badRequest('Please provide key-value pairs for settings to update.');
}

try {
    $db = Database::getConnection();
    $stmt = $db->prepare("
        INSERT INTO system_settings (setting_key, setting_value, description) 
        VALUES (:key, :val, :desc) 
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), description = COALESCE(VALUES(description), description)
    ");

    foreach ($settings as $key => $data) {
        $val = is_array($data) ? ($data['value'] ?? '') : (string)$data;
        $desc = is_array($data) ? ($data['description'] ?? null) : null;

        $stmt->execute([
            ':key' => $key,
            ':val' => (string)$val,
            ':desc' => $desc
        ]);
    }

    logActivity(
        $user['id'],
        'update_settings',
        'Settings',
        "Super Admin updated system configuration parameters."
    );

    Response::success(null, 'Library system settings updated successfully.');

} catch (PDOException $e) {
    Response::error('Database error: ' . $e->getMessage());
}

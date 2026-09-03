<?php
// backend/api/settings/get.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed. Only GET is supported.', 405);
}

try {
    $db = Database::getConnection();
    $stmt = $db->query("SELECT setting_key, setting_value, description FROM system_settings");
    $settingsRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $settingsMap = [];
    foreach ($settingsRows as $row) {
        $settingsMap[$row['setting_key']] = [
            'value' => $row['setting_value'],
            'description' => $row['description']
        ];
    }

    Response::success($settingsMap, 'System settings fetched successfully.');
} catch (PDOException $e) {
    Response::error('Database error: ' . $e->getMessage());
}

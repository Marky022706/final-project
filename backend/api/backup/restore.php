<?php
// backend/api/backup/restore.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/activity_logger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

// Super Admin ONLY
$user = JWT::requireSuperAdmin();
$input = Utils::getJsonInput();

$backupId = $input['backup_id'] ?? null;
if (!$backupId) {
    Response::badRequest('Backup ID is required.');
}

try {
    $db = Database::getConnection();

    $stmt = $db->prepare("SELECT * FROM backups WHERE id = :id");
    $stmt->execute([':id' => $backupId]);
    $backup = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$backup) {
        Response::notFound('Backup record not found.');
    }

    $fullPath = __DIR__ . '/../../' . $backup['file_path'];
    if (!file_exists($fullPath)) {
        Response::notFound('Backup file not found on disk at: ' . $backup['file_path']);
    }

    $sqlContent = file_get_contents($fullPath);
    if (empty($sqlContent)) {
        Response::error('Backup file is empty.');
    }

    // Execute restore queries
    $db->exec($sqlContent);

    logActivity(
        $user['id'],
        'restore_database',
        'SystemBackup',
        "Super Admin executed database restoration from archive {$backup['backup_name']}."
    );

    // Log to system_logs
    try {
        $stmtSys = $db->prepare("INSERT INTO system_logs (log_type, severity, message, ip_address, user_agent) VALUES ('restore', 'warning', :msg, :ip, :ua)");
        $stmtSys->execute([
            ':msg' => "Database restored from backup: {$backup['backup_name']}",
            ':ip' => $_SERVER['REMOTE_ADDR'] ?? null,
            ':ua' => $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);
    } catch (Exception $e) {}

    Response::success(null, "Database has been restored successfully from snapshot '{$backup['backup_name']}'.");

} catch (Exception $e) {
    Response::error('Database restore error: ' . $e->getMessage());
}

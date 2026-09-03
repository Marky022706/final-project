<?php
// backend/api/backup/create.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/activity_logger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

// Super Admin only
$user = JWT::requireSuperAdmin();

try {
    $db = Database::getConnection();

    $backupDir = __DIR__ . '/../../backups';
    if (!file_exists($backupDir)) {
        mkdir($backupDir, 0777, true);
    }

    $timestamp = date('Y-m-d_His');
    $backupFileName = "backup_balingasag_{$timestamp}.sql";
    $backupFilePath = $backupDir . '/' . $backupFileName;

    // Export tables structure and data
    $tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);

    $sqlDump = "-- Balingasag Municipal Public Library Database Backup\n";
    $sqlDump .= "-- Generated: " . date('Y-m-d H:i:s') . "\n";
    $sqlDump .= "-- Database: " . DB_NAME . "\n\n";
    $sqlDump .= "SET FOREIGN_KEY_CHECKS = 0;\n\n";

    foreach ($tables as $table) {
        // Skip backups table content to prevent infinite recursion
        if ($table === 'backups') continue;

        // Table Structure
        $createTableSql = $db->query("SHOW CREATE TABLE `$table`")->fetch(PDO::FETCH_ASSOC)['Create Table'];
        $sqlDump .= "DROP TABLE IF EXISTS `$table`;\n";
        $sqlDump .= $createTableSql . ";\n\n";

        // Table Data
        $rows = $db->query("SELECT * FROM `$table`")->fetchAll(PDO::FETCH_ASSOC);
        if (!empty($rows)) {
            $cols = array_keys($rows[0]);
            $colNames = implode('`, `', $cols);

            $sqlDump .= "INSERT INTO `$table` (`$colNames`) VALUES \n";
            $rowInserts = [];
            foreach ($rows as $row) {
                $values = array_map(function($val) use ($db) {
                    if ($val === null) return "NULL";
                    return $db->quote($val);
                }, array_values($row));
                $rowInserts[] = "(" . implode(', ', $values) . ")";
            }
            $sqlDump .= implode(",\n", $rowInserts) . ";\n\n";
        }
    }

    $sqlDump .= "SET FOREIGN_KEY_CHECKS = 1;\n";

    file_put_contents($backupFilePath, $sqlDump);
    $fileSizeKb = (int)ceil(filesize($backupFilePath) / 1024);

    // Save record to backups table
    $stmt = $db->prepare("
        INSERT INTO backups (backup_name, file_path, file_size_kb, created_by, status)
        VALUES (:name, :path, :size, :by, 'completed')
    ");
    $stmt->execute([
        ':name' => $backupFileName,
        ':path' => "backups/{$backupFileName}",
        ':size' => $fileSizeKb,
        ':by' => $user['id']
    ]);

    logActivity(
        $user['id'],
        'create_backup',
        'SystemBackup',
        "Super Admin created database snapshot ($backupFileName, {$fileSizeKb} KB)."
    );

    // Log to system_logs
    try {
        $stmtSys = $db->prepare("INSERT INTO system_logs (log_type, severity, message, ip_address, user_agent) VALUES ('backup', 'info', :msg, :ip, :ua)");
        $stmtSys->execute([
            ':msg' => "Database backup created: $backupFileName ({$fileSizeKb} KB)",
            ':ip' => $_SERVER['REMOTE_ADDR'] ?? null,
            ':ua' => $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);
    } catch (Exception $e) {}

    Response::created([
        'backup_name' => $backupFileName,
        'file_size_kb' => $fileSizeKb,
        'created_at' => date('Y-m-d H:i:s')
    ], 'Database backup archive created successfully!');

} catch (Exception $e) {
    Response::error('Backup creation failed: ' . $e->getMessage());
}

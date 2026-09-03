<?php
// backend/database/fix_all_hashes.php
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../config/database.php';

try {
    $db = Database::getConnection();
    echo "Connected to database.\n";

    $adminHash = password_hash('admin123', PASSWORD_DEFAULT);
    $memberHash = password_hash('member123', PASSWORD_DEFAULT);

    echo "Admin Hash: $adminHash\n";
    echo "Member Hash: $memberHash\n";

    $stmt = $db->prepare("UPDATE users SET password_hash = :hash, status = 'active' WHERE email = :email");

    $stmt->execute([':hash' => $adminHash, ':email' => 'superadmin@balingasag.gov.ph']);
    echo "Updated superadmin@balingasag.gov.ph\n";

    $stmt->execute([':hash' => $adminHash, ':email' => 'admin@balingasag.gov.ph']);
    echo "Updated admin@balingasag.gov.ph\n";

    $stmt->execute([':hash' => $memberHash, ':email' => 'member@balingasag.gov.ph']);
    echo "Updated member@balingasag.gov.ph\n";

    $stmt->execute([':hash' => $memberHash, ':email' => 'maria@gmail.com']);
    echo "Updated maria@gmail.com\n";

    // Test verification
    $users = $db->query("SELECT email, password_hash FROM users")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($users as $u) {
        $testPass = ($u['email'] === 'superadmin@balingasag.gov.ph' || $u['email'] === 'admin@balingasag.gov.ph') ? 'admin123' : 'member123';
        $matches = password_verify($testPass, $u['password_hash']);
        echo "Check {$u['email']} with '$testPass' -> " . ($matches ? 'PASS ✅' : 'FAIL ❌') . "\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

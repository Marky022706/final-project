<?php
// backend/database/test_logins.php
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../config/database.php';

$db = Database::getConnection();

$accounts = [
    ['superadmin@balingasag.gov.ph', 'admin123'],
    ['admin@balingasag.gov.ph', 'admin123'],
    ['member@balingasag.gov.ph', 'member123'],
    ['maria@gmail.com', 'member123']
];

foreach ($accounts as $acc) {
    $email = $acc[0];
    $pwd = $acc[1];

    $stmt = $db->prepare("SELECT * FROM users WHERE email = :email");
    $stmt->execute([':email' => $email]);
    $u = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$u) {
        echo "❌ User $email NOT FOUND in database.\n";
        continue;
    }

    $valid = password_verify($pwd, $u['password_hash']);
    if ($valid) {
        echo "✅ Login OK: $email | Password: '$pwd' | Role: {$u['role']} | Status: {$u['status']}\n";
    } else {
        echo "❌ Password mismatch for $email.\n";
    }
}

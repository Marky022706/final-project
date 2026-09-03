<?php
// backend/database/create_admin_member_accounts.php
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../config/database.php';

try {
    $db = Database::getConnection();
    echo "Connected to database successfully.\n";

    // 1. Ensure qr_code column exists in users table
    $columns = $db->query("SHOW COLUMNS FROM users LIKE 'qr_code'")->fetchAll();
    if (empty($columns)) {
        echo "Adding qr_code column to users table...\n";
        $db->exec("ALTER TABLE users ADD COLUMN qr_code VARCHAR(255) UNIQUE NULL AFTER address");
        echo "qr_code column added successfully.\n";
    }

    // 2. Define Accounts to Create
    $accounts = [
        [
            'first_name' => 'Admin',
            'middle_name' => 'Municipal',
            'last_name' => 'User',
            'email' => 'admin@balingasag.gov.ph',
            'password' => 'admin123',
            'role' => 'admin',
            'phone' => '09171234567',
            'address' => 'Municipal Hall, Balingasag, Misamis Oriental',
            'status' => 'active'
        ],
        [
            'first_name' => 'Juan',
            'middle_name' => 'Ponce',
            'last_name' => 'Dela Cruz',
            'email' => 'member@balingasag.gov.ph',
            'password' => 'member123',
            'role' => 'member',
            'phone' => '09187654321',
            'address' => 'Barangay 15, Balingasag, Misamis Oriental',
            'status' => 'active'
        ]
    ];

    $checkStmt = $db->prepare("SELECT id, email, role FROM users WHERE email = :email");
    $insertStmt = $db->prepare("INSERT INTO users (first_name, middle_name, last_name, email, password_hash, role, phone, address, status, member_since, qr_code)
        VALUES (:first_name, :middle_name, :last_name, :email, :password_hash, :role, :phone, :address, :status, CURRENT_DATE, :qr_code)");
    $updateStmt = $db->prepare("UPDATE users SET first_name = :first_name, middle_name = :middle_name, last_name = :last_name, password_hash = :password_hash, role = :role, phone = :phone, address = :address, status = :status, qr_code = COALESCE(qr_code, :qr_code) WHERE email = :email");

    foreach ($accounts as $acc) {
        $checkStmt->execute([':email' => $acc['email']]);
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        $qrCode = 'LIB-' . strtoupper(bin2hex(random_bytes(8)));
        $passwordHash = password_hash($acc['password'], PASSWORD_DEFAULT);

        if ($existing) {
            echo "Account '{$acc['email']}' already exists (ID: {$existing['id']}). Updating credentials and details...\n";
            $updateStmt->execute([
                ':first_name' => $acc['first_name'],
                ':middle_name' => $acc['middle_name'],
                ':last_name' => $acc['last_name'],
                ':password_hash' => $passwordHash,
                ':role' => $acc['role'],
                ':phone' => $acc['phone'],
                ':address' => $acc['address'],
                ':status' => $acc['status'],
                ':qr_code' => $qrCode,
                ':email' => $acc['email']
            ]);
            echo "Successfully updated {$acc['role']} account: {$acc['email']}\n";
        } else {
            echo "Creating new {$acc['role']} account: {$acc['email']}...\n";
            $insertStmt->execute([
                ':first_name' => $acc['first_name'],
                ':middle_name' => $acc['middle_name'],
                ':last_name' => $acc['last_name'],
                ':email' => $acc['email'],
                ':password_hash' => $passwordHash,
                ':role' => $acc['role'],
                ':phone' => $acc['phone'],
                ':address' => $acc['address'],
                ':status' => $acc['status'],
                ':qr_code' => $qrCode
            ]);
            echo "Successfully created {$acc['role']} account: {$acc['email']}\n";
        }
    }

    echo "\n----------------------------------------\n";
    echo "CURRENT USERS IN DATABASE:\n";
    $listStmt = $db->query("SELECT id, first_name, last_name, email, role, status, qr_code, created_at FROM users");
    $users = $listStmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($users as $u) {
        echo "[ID: {$u['id']}] {$u['first_name']} {$u['last_name']} | Email: {$u['email']} | Role: {$u['role']} | QR: {$u['qr_code']}\n";
    }
    echo "----------------------------------------\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

<?php
// backend/database/sync_passwords.php
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../config/database.php';

try {
    $db = Database::getConnection();
    echo "Connected to database.\n";

    // Relax strict non-null constraints on legacy columns
    $legacyCols = ['member_id', 'phone_number', 'school_or_org', 'avatar_url', 'qr_code_data', 'approved_by', 'approved_at', 'school_id_image'];
    foreach ($legacyCols as $lc) {
        $exists = $db->query("SHOW COLUMNS FROM users LIKE '$lc'")->fetch();
        if ($exists) {
            $db->exec("ALTER TABLE users MODIFY COLUMN `$lc` VARCHAR(255) NULL DEFAULT NULL");
        }
    }

    // Define Accounts
    $accounts = [
        ['superadmin@balingasag.gov.ph', 'admin123', 'superadmin', 'active', 'Master', 'Super', 'Administrator', 'SUPER-001'],
        ['admin@balingasag.gov.ph', 'admin123', 'admin', 'active', 'Admin', 'Municipal', 'Librarian', 'ADM-001'],
        ['member@balingasag.gov.ph', 'member123', 'member', 'active', 'Juan', 'Ponce', 'Dela Cruz', 'MEM-001'],
        ['maria@gmail.com', 'member123', 'member', 'active', 'Maria', 'Santos', 'Clara', 'MEM-002']
    ];

    $checkStmt = $db->prepare("SELECT id FROM users WHERE email = :email");
    $updateStmt = $db->prepare("
        UPDATE users 
        SET password_hash = :pwd, role = :role, status = :status, first_name = :fn, middle_name = :mn, last_name = :ln, phone = '09171234567', phone_number = '09171234567', address = 'Balingasag, Misamis Oriental' 
        WHERE email = :email
    ");

    $idTypeStmt = $db->query("SHOW COLUMNS FROM users WHERE Field = 'id'");
    $idCol = $idTypeStmt->fetch(PDO::FETCH_ASSOC);
    $hasAutoInc = strpos($idCol['Extra'] ?? '', 'auto_increment') !== false;

    foreach ($accounts as $acc) {
        $email = $acc[0];
        $pwdPlain = $acc[1];
        $role = $acc[2];
        $status = $acc[3];
        $fn = $acc[4];
        $mn = $acc[5];
        $ln = $acc[6];
        $memId = $acc[7];

        $hash = password_hash($pwdPlain, PASSWORD_DEFAULT);

        $checkStmt->execute([':email' => $email]);
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            $updateStmt->execute([
                ':pwd' => $hash,
                ':role' => $role,
                ':status' => $status,
                ':fn' => $fn,
                ':mn' => $mn,
                ':ln' => $ln,
                ':email' => $email
            ]);
            echo "Updated $email -> Password: '$pwdPlain', Role: $role, Status: $status\n";
        } else {
            $newId = $hasAutoInc ? null : ('USR-' . strtoupper(substr(uniqid(), -6)));
            $qr = 'LIB-' . strtoupper(bin2hex(random_bytes(6)));

            $fields = ['first_name', 'middle_name', 'last_name', 'email', 'password_hash', 'role', 'phone', 'phone_number', 'address', 'status', 'member_since', 'qr_code', 'qr_code_data', 'member_id'];
            $placeholders = [':fn', ':mn', ':ln', ':email', ':pwd', ':role', "'09171234567'", "'09171234567'", "'Balingasag, Misamis Oriental'", ':status', 'CURRENT_DATE', ':qr1', ':qr2', ':mem_id'];
            $params = [
                ':fn' => $fn,
                ':mn' => $mn,
                ':ln' => $ln,
                ':email' => $email,
                ':pwd' => $hash,
                ':role' => $role,
                ':status' => $status,
                ':qr1' => $qr,
                ':qr2' => $qr,
                ':mem_id' => $memId
            ];

            if (!$hasAutoInc) {
                $fields[] = 'id';
                $placeholders[] = ':id';
                $params[':id'] = $newId;
            }

            $sql = "INSERT INTO users (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $placeholders) . ")";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);

            echo "Created $email -> Password: '$pwdPlain', Role: $role, Status: $status\n";
        }
    }

    echo "\nAll default accounts and passwords successfully created and verified!\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

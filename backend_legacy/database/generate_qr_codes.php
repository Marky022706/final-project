<?php
// backend/database/generate_qr_codes.php
// Migration script to generate QR codes for existing users
require_once __DIR__ . '/../config/database.php';

try {
    $db = Database::getConnection();
    
    // Get all users without QR codes
    $stmt = $db->query("SELECT id FROM users WHERE qr_code IS NULL OR qr_code = ''");
    $users = $stmt->fetchAll();
    
    $count = 0;
    foreach ($users as $user) {
        // Generate unique QR code
        $qrCode = 'LIB-' . strtoupper(bin2hex(random_bytes(8)));
        
        // Update user with QR code
        $updateStmt = $db->prepare("UPDATE users SET qr_code = :qr_code WHERE id = :id");
        $updateStmt->execute([
            ':qr_code' => $qrCode,
            ':id' => $user['id']
        ]);
        
        $count++;
    }
    
    echo "Successfully generated QR codes for {$count} existing users.\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

<?php
// backend/api/attendance/scan.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/middleware.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/activity_logger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed. Only POST is supported.', 405);
}

$currentUser = Middleware::requireAuth();
$input = Utils::getJsonInput();

$required = ['qr_code'];
$missing = Utils::checkRequired($required, $input);

if (!empty($missing)) {
    Response::badRequest('Missing required fields: ' . implode(', ', $missing));
}

$qrCode = trim($input['qr_code']);

if (empty($qrCode)) {
    Response::badRequest('QR code value cannot be empty.');
}

try {
    $db = Database::getConnection();
    
    // Find user by QR code, member ID, user ID, or email
    $stmt = $db->prepare("
        SELECT id, member_id, first_name, middle_name, last_name, email, role, status, qr_code
        FROM users 
        WHERE (qr_code = :qr1 OR qr_code_data = :qr2 OR member_id = :qr3 OR id = :qr4 OR email = :qr5) 
          AND status = 'active'
        LIMIT 1
    ");
    $stmt->execute([
        ':qr1' => $qrCode,
        ':qr2' => $qrCode,
        ':qr3' => $qrCode,
        ':qr4' => $qrCode,
        ':qr5' => $qrCode
    ]);
    $user = $stmt->fetch();
    
    if (!$user) {
        // Log invalid QR scan
        logActivity(
            $currentUser['id'],
            'invalid_qr_scan',
            'Attendance',
            "Invalid QR code scanned: {$qrCode}"
        );
        Response::error('Invalid QR code or user not found.', 404);
    }
    
    $fullName = trim("{$user['first_name']} {$user['last_name']}");
    $now = date('Y-m-d H:i:s');
    $currentTime = strtotime($now);
    
    // Check for open active visit today
    $stmt = $db->prepare("
        SELECT * FROM attendance 
        WHERE user_id = :user_id 
        ORDER BY time_in DESC 
        LIMIT 1
    ");
    $stmt->execute([':user_id' => $user['id']]);
    $lastAttendance = $stmt->fetch();
    
    if ($lastAttendance) {
        $lastScanTime = strtotime($lastAttendance['time_out'] ?? $lastAttendance['time_in']);
        $timeDiff = $currentTime - $lastScanTime;
        
        if ($timeDiff < 10) {
            Response::error('Please wait at least 10 seconds before scanning again.', 400);
        }
        
        // If the last attendance was today and is still active (time_out IS NULL or status = 'active')
        $isToday = date('Y-m-d', strtotime($lastAttendance['time_in'])) === date('Y-m-d');
        if ($isToday && (empty($lastAttendance['time_out']) || ($lastAttendance['status'] ?? 'active') === 'active')) {
            // Record Time Out
            $timeInStamp = strtotime($lastAttendance['time_in']);
            $durationSeconds = max(0, $currentTime - $timeInStamp);
            
            $stmtUpdate = $db->prepare("
                UPDATE attendance 
                SET time_out = :time_out, 
                    visit_duration = :duration, 
                    status = 'completed' 
                WHERE id = :id
            ");
            $stmtUpdate->execute([
                ':time_out' => $now,
                ':duration' => $durationSeconds,
                ':id' => $lastAttendance['id']
            ]);
            
            logActivity(
                $currentUser['id'],
                'time_out',
                'Attendance',
                "Time Out recorded for {$fullName} (Duration: " . gmdate('H:i:s', $durationSeconds) . ")"
            );
            
            Response::success([
                'action' => 'time_out',
                'user' => [
                    'id' => $user['id'],
                    'member_id' => $user['member_id'],
                    'name' => $fullName,
                    'email' => $user['email'],
                    'role' => $user['role']
                ],
                'time_in' => $lastAttendance['time_in'],
                'time_out' => $now,
                'visit_duration' => $durationSeconds,
                'formatted_duration' => gmdate('H:i:s', $durationSeconds)
            ], "Time Out recorded for {$fullName}!");
        }
    }
    
    // Create new Time In attendance record
    $stmtInsert = $db->prepare("
        INSERT INTO attendance (user_id, full_name, role, purpose, time_in, status, date)
        VALUES (:user_id, :full_name, :role, 'Library Visit', :time_in, 'active', :date)
    ");
    $stmtInsert->execute([
        ':user_id' => $user['id'],
        ':full_name' => $fullName,
        ':role' => $user['role'] ?? 'member',
        ':time_in' => $now,
        ':date' => date('Y-m-d')
    ]);
    
    // Log time in
    logActivity(
        $currentUser['id'],
        'time_in',
        'Attendance',
        "Time In recorded for {$fullName}"
    );
    
    Response::success([
        'action' => 'time_in',
        'user' => [
            'id' => $user['id'],
            'member_id' => $user['member_id'],
            'name' => $fullName,
            'email' => $user['email'],
            'role' => $user['role']
        ],
        'time_in' => $now
    ], "Time In recorded successfully for {$fullName}!");
    
} catch (PDOException $e) {
    error_log("Attendance scan error: " . $e->getMessage());
    Response::error('Server database error: ' . $e->getMessage());
} catch (Exception $e) {
    error_log("Attendance scan error: " . $e->getMessage());
    Response::error('Server error: ' . $e->getMessage());
}

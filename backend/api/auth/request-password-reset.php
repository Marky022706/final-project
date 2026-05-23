<?php
// backend/api/auth/request-password-reset.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed. Only POST is supported.', 405);
}

$input = Utils::getJsonInput();

$missing = Utils::checkRequired(['phone'], $input);
if (!empty($missing)) {
    Response::badRequest('Missing required fields: ' . implode(', ', $missing));
}

$phone = preg_replace('/\s+/', '', $input['phone']);

if (strlen($phone) < 7) {
    Response::badRequest('Please enter a valid phone number.');
}

function sendPasswordResetCodeSms($phoneNumber, $code) {
    if (SMS_PROVIDER === 'semaphore' && SEMAPHORE_API_KEY !== '') {
        $message = "Your Balingasag Library password reset code is {$code}. It expires in 10 minutes.";
        $payload = http_build_query([
            'apikey' => SEMAPHORE_API_KEY,
            'number' => $phoneNumber,
            'message' => $message,
            'sendername' => SMS_SENDER_NAME,
        ]);

        $ch = curl_init('https://api.semaphore.co/api/v4/messages');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        $result = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return $result !== false && $status >= 200 && $status < 300;
    }

    // Local fallback: lets the reset flow be tested before an SMS provider is configured.
    return true;
}

try {
    $db = Database::getConnection();

    $db->exec("
        CREATE TABLE IF NOT EXISTS password_reset_codes (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            phone VARCHAR(20) NOT NULL,
            code_hash VARCHAR(255) NOT NULL,
            expires_at DATETIME NOT NULL,
            used_at DATETIME NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_password_reset_phone (phone),
            INDEX idx_password_reset_user_expires (user_id, expires_at),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $stmt = $db->prepare("SELECT id, phone FROM users WHERE REPLACE(phone, ' ', '') = :phone AND status = 'active' LIMIT 1");
    $stmt->execute([':phone' => $phone]);
    $user = $stmt->fetch();

    // Keep response generic so unknown numbers cannot be easily enumerated.
    if (!$user) {
        Response::success(null, 'If this number is registered, a reset code has been sent.');
    }

    $code = (string) random_int(100000, 999999);
    $expiresAt = date('Y-m-d H:i:s', time() + 10 * 60);

    $db->prepare("UPDATE password_reset_codes SET used_at = NOW() WHERE user_id = :user_id AND used_at IS NULL")
        ->execute([':user_id' => $user['id']]);

    $stmtInsert = $db->prepare("
        INSERT INTO password_reset_codes (user_id, phone, code_hash, expires_at)
        VALUES (:user_id, :phone, :code_hash, :expires_at)
    ");
    $stmtInsert->execute([
        ':user_id' => $user['id'],
        ':phone' => $phone,
        ':code_hash' => password_hash($code, PASSWORD_DEFAULT),
        ':expires_at' => $expiresAt,
    ]);

    $smsSent = sendPasswordResetCodeSms($phone, $code);
    if (!$smsSent) {
        Response::error('Unable to send reset code right now. Please try again later.');
    }

    $payload = ['expires_in_minutes' => 10];
    if (APP_ENV === 'local' && SMS_PROVIDER === 'local') {
        $payload['dev_code'] = $code;
    }

    Response::success($payload, 'Password reset code sent to your registered phone number.');

} catch (PDOException $e) {
    Response::error('Server database error: ' . $e->getMessage());
} catch (Exception $e) {
    Response::error('Unable to generate reset code: ' . $e->getMessage());
}

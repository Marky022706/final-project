<?php
// backend/config/middleware.php
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/response.php';

class Middleware {
    /**
     * Configure CORS Headers on every request
     */
    public static function handleCORS() {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        if (in_array($origin, ALLOWED_ORIGINS)) {
            header("Access-Control-Allow-Origin: $origin");
            header("Access-Control-Allow-Credentials: true");
        } else {
            // Default fallback
            header("Access-Control-Allow-Origin: *");
        }

        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header("Access-Control-Max-Age: 86400"); // Cache preflight for 1 day

        // Handle OPTIONS Preflight Requests
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            if (ob_get_length()) ob_clean();
            http_response_code(200);
            exit();
        }
    }

    /**
     * Authenticates the request and returns the JWT User Payload
     */
    public static function requireAuth() {
        self::handleCORS();

        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (empty($authHeader)) {
            if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
                $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
            } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
                $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
            } elseif (isset($_SERVER['Authorization'])) {
                $authHeader = $_SERVER['Authorization'];
            }
        }

        if (empty($authHeader)) {
            Response::unauthorized('Authentication token is missing.');
        }

        // Parse Bearer Token
        if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $token = $matches[1];
            $payload = JWT::verifyAccess($token);
            
            if (!$payload) {
                Response::unauthorized('Access token is invalid or expired.');
            }
            
            return $payload;
        }

        Response::badRequest('Authorization header format must be: Bearer <token>');
    }

    /**
     * Authenticates and checks if the user is an Administrator or Super Admin
     */
    public static function requireAdmin() {
        $user = self::requireAuth();
        
        if (!in_array($user['role'] ?? '', ['admin', 'superadmin'])) {
            Response::forbidden('Access forbidden. Admin role is required.');
        }
        
        return $user;
    }

}

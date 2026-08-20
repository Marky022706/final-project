<?php
// backend/includes/auth.php
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/response.php';

class JWT {
    /**
     * Helper to encode to base64Url standard
     */
    private static function base64UrlEncode($text) {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($text));
    }

    /**
     * Helper to decode from base64Url standard
     */
    private static function base64UrlDecode($text) {
        $padding = strlen($text) % 4;
        if ($padding) {
            $text .= str_repeat('=', 4 - $padding);
        }
        return base64_decode(str_replace(['-', '_'], ['+', '/'], $text));
    }

    /**
     * Generate a new Token (Access or Refresh)
     */
    private static function createToken($payload, $secret, $lifespan) {
        $header = json_encode([
            'alg' => 'HS256',
            'typ' => 'JWT'
        ]);

        $payload['iat'] = time();
        $payload['exp'] = time() + $lifespan;
        
        $encodedHeader = self::base64UrlEncode($header);
        $encodedPayload = self::base64UrlEncode(json_encode($payload));

        $signatureInput = $encodedHeader . '.' . $encodedPayload;
        $signature = hash_hmac('sha256', $signatureInput, $secret, true);
        $encodedSignature = self::base64UrlEncode($signature);

        return $encodedHeader . '.' . $encodedPayload . '.' . $encodedSignature;
    }

    /**
     * Generate an Access Token (15 mins)
     */
    public static function generateAccess($userPayload) {
        return self::createToken($userPayload, JWT_ACCESS_SECRET, JWT_ACCESS_EXPIRY);
    }

    /**
     * Generate a Refresh Token (7 days)
     */
    public static function generateRefresh($userPayload) {
        return self::createToken($userPayload, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRY);
    }

    /**
     * Verify a Token and return its payload if valid
     */
    private static function verifyToken($token, $secret) {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }

        list($encodedHeader, $encodedPayload, $encodedSignature) = $parts;

        // Verify Signature
        $signatureInput = $encodedHeader . '.' . $encodedPayload;
        $calculatedSignature = hash_hmac('sha256', $signatureInput, $secret, true);
        $encodedCalculatedSignature = self::base64UrlEncode($calculatedSignature);

        if (!hash_equals($encodedSignature, $encodedCalculatedSignature)) {
            return false; // Signature mismatch
        }

        $payload = json_decode(self::base64UrlDecode($encodedPayload), true);
        
        // Verify Expiry
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false; // Token has expired
        }

        return $payload;
    }

    /**
     * Verify an Access Token
     */
    public static function verifyAccess($token) {
        return self::verifyToken($token, JWT_ACCESS_SECRET);
    }

    /**
     * Verify a Refresh Token
     */
    public static function verifyRefresh($token) {
        return self::verifyToken($token, JWT_REFRESH_SECRET);
    }

    /**
     * Extract bearer token from Authorization header
     */
    public static function getBearerToken() {
        $headers = null;
        if (isset($_SERVER['Authorization'])) {
            $headers = trim($_SERVER["Authorization"]);
        } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
        } elseif (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
            if (isset($requestHeaders['Authorization'])) {
                $headers = trim($requestHeaders['Authorization']);
            }
        }
        
        if (!empty($headers)) {
            if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
                return $matches[1];
            }
        }
        return null;
    }

    /**
     * Get Authenticated User Payload or return false
     */
    public static function getAuthenticatedUser() {
        $token = self::getBearerToken();
        if (!$token) {
            return false;
        }
        return self::verifyAccess($token);
    }

    /**
     * Require any valid authenticated user
     */
    public static function requireAuth() {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            Response::unauthorized('Authentication required. Please provide a valid Bearer token.');
        }
        return $user;
    }

    /**
     * Require specific roles (e.g. ['admin', 'superadmin'])
     */
    public static function requireRole($allowedRoles = []) {
        $user = self::requireAuth();
        if (!is_array($allowedRoles)) {
            $allowedRoles = [$allowedRoles];
        }
        
        $userRole = $user['role'] ?? 'member';
        if (!in_array($userRole, $allowedRoles)) {
            Response::forbidden('Access forbidden. You do not have the required permissions for this action.');
        }
        return $user;
    }

    /**
     * Require Super Admin role specifically
     */
    public static function requireSuperAdmin() {
        return self::requireRole(['superadmin']);
    }
}

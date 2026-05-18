<?php
// backend/includes/auth.php
require_once __DIR__ . '/../config/constants.php';

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
}

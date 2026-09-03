<?php
// backend/includes/response.php

class Response {
    /**
     * Send a standardized JSON response and exit
     */
    public static function send($success, $data = null, $message = '', $statusCode = 200) {
        // Clear buffer
        if (ob_get_length()) ob_clean();

        // Set Headers
        header('Content-Type: application/json; charset=UTF-8');
        http_response_code($statusCode);

        echo json_encode([
            'success' => (bool)$success,
            'data' => $data,
            'message' => (string)$message
        ]);
        exit();
    }

    public static function success($data = null, $message = 'Success') {
        self::send(true, $data, $message, 200);
    }

    public static function created($data = null, $message = 'Created Successfully') {
        self::send(true, $data, $message, 201);
    }

    public static function error($message = 'An error occurred', $statusCode = 500) {
        self::send(false, null, $message, $statusCode);
    }

    public static function badRequest($message = 'Bad Request') {
        self::error($message, 400);
    }

    public static function unauthorized($message = 'Unauthorized access') {
        self::error($message, 401);
    }

    public static function forbidden($message = 'Access forbidden') {
        self::error($message, 403);
    }

    public static function notFound($message = 'Resource not found') {
        self::error($message, 404);
    }
}

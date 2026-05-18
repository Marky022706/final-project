<?php
// backend/index.php
require_once __DIR__ . '/config/constants.php';
require_once __DIR__ . '/config/middleware.php';
require_once __DIR__ . '/includes/response.php';

// Initialize global CORS headers and preflight handling
Middleware::handleCORS();

// Parse requested URL path
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$scriptName = $_SERVER['SCRIPT_NAME'] ?? '';

// Eliminate query parameters from URI path
$path = parse_url($requestUri, PHP_URL_PATH);

// Clean up project subdirectories (e.g. "/final-project/backend/api/auth/login" -> "api/auth/login")
$baseDir = dirname($scriptName);
if (strpos($path, $baseDir) === 0) {
    $path = substr($path, strlen($baseDir));
}
$path = trim($path, '/');

// Verify if the request is targeting the API
if (preg_match('/^api\//', $path)) {
    // Map URL path to a PHP script (e.g. "api/auth/login" -> "api/auth/login.php")
    $apiFile = __DIR__ . '/' . $path . '.php';

    if (file_exists($apiFile)) {
        require_once $apiFile;
        exit();
    } else {
        Response::notFound("Endpoint '$path' does not exist.");
    }
}

// Default Landing
Response::success(['system' => 'Balingasag Public Library Management System API', 'version' => '1.0.0'], 'Welcome to the Balingasag Public Library REST API!');

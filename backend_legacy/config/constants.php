<?php
// backend/config/constants.php

// CORS Settings
define('ALLOWED_ORIGINS', [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000'
]);

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'balingasag_library');
define('DB_USER', 'root');
define('DB_PASS', '');

// Library Policy Configurations
define('FINE_RATE_PER_DAY', 5.00); // ₱5.00 per day
define('MAX_BORROWED_BOOKS', 3);   // Max 3 books active per member
define('BORROW_DURATION_DAYS', 14); // Borrow duration 14 days
define('ADMIN_REGISTRATION_PASSWORD', 'admin123'); // Admin passcode

// SMS Settings for password reset codes.
// Set SMS_PROVIDER to 'semaphore' and add your API key to send real SMS messages.
define('APP_ENV', 'local');
define('SMS_PROVIDER', 'local');
define('SEMAPHORE_API_KEY', '');
define('SMS_SENDER_NAME', 'Library');

// Local AI Settings (LM Studio / Qwen Local Server)
define('LOCAL_AI_BASE_URL', 'http://127.0.0.1:1234');
define('LOCAL_AI_MODEL', 'qwen/qwen3-1.7b');
define('LOCAL_AI_TIMEOUT', 45); // seconds

// Gemini Cloud Fallback Settings
define('GEMINI_API_KEY', getenv('GEMINI_API_KEY') ?: '');
define('GEMINI_MODEL', getenv('GEMINI_MODEL') ?: 'gemini-1.5-flash');

// JWT Security Keys (State-of-the-art HS256 HMAC Signatures)
define('JWT_ACCESS_SECRET', 'balingasag_public_library_access_secret_2026_super_secure_key_987654321');
define('JWT_REFRESH_SECRET', 'balingasag_public_library_refresh_secret_2026_super_secure_key_123456789');

// Lifespans (seconds)
define('JWT_ACCESS_EXPIRY', 900);       // 15 Minutes
define('JWT_REFRESH_EXPIRY', 604800);   // 7 Days

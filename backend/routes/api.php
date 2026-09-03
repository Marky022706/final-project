<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\BookController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\RequestController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\FineController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\MemberFeatureController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\SystemLogController;
use App\Http\Controllers\Api\BackupController;
use App\Http\Controllers\Api\RecycleBinController;
use App\Http\Controllers\Api\AiController;

// --------------------------------------------------------------------------
// Authentication Routes (Public)
// --------------------------------------------------------------------------
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login'])->name('login');
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::post('/request-password-reset', [AuthController::class, 'requestPasswordReset']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);
});

// --------------------------------------------------------------------------
// Public Reports & Public Information
// --------------------------------------------------------------------------
Route::get('/reports/public-stats', [ReportController::class, 'publicStats']);
Route::get('/announcements/list', [AnnouncementController::class, 'list']);
Route::get('/books/getAll', [BookController::class, 'getAll']);
Route::get('/books/getOne', [BookController::class, 'getOne']);
Route::get('/member-features/digital_resources', [MemberFeatureController::class, 'digitalResources']);
Route::match(['get', 'post'], '/ai/isbn-lookup', [AiController::class, 'isbnLookup']);
Route::post('/ai/chat', [AiController::class, 'chat']);

// --------------------------------------------------------------------------
// Live Attendance QR Scanning Counter (Public / Counter Terminal)
// --------------------------------------------------------------------------
Route::prefix('attendance')->group(function () {
    Route::get('/list', [AttendanceController::class, 'list']);
    Route::post('/scan', [AttendanceController::class, 'scan']);
    Route::get('/stats', [AttendanceController::class, 'stats']);
});

// --------------------------------------------------------------------------
// Authenticated API Routes
// --------------------------------------------------------------------------
Route::middleware('auth:sanctum')->group(function () {
    // User Profile & Directory
    Route::match(['get', 'post'], '/users/get', [UserController::class, 'get']);
    Route::get('/users/list', [UserController::class, 'list']);
    Route::match(['post', 'put'], '/users/update', [UserController::class, 'update']);
    Route::match(['post', 'delete'], '/users/delete', [UserController::class, 'delete']);

    // Book Catalog Management
    Route::post('/books/create', [BookController::class, 'create']);
    Route::match(['post', 'put'], '/books/update', [BookController::class, 'update']);
    Route::match(['post', 'delete'], '/books/delete', [BookController::class, 'delete']);
    Route::post('/books/archive', [BookController::class, 'archive']);

    // Transactions / Circulation
    Route::get('/transactions/list', [TransactionController::class, 'list']);
    Route::post('/transactions/borrow', [TransactionController::class, 'borrow']);
    Route::post('/transactions/return', [TransactionController::class, 'return']);

    // Reservations
    Route::get('/reservations/list', [ReservationController::class, 'list']);
    Route::post('/reservations/create', [ReservationController::class, 'create']);
    Route::post('/reservations/cancel', [ReservationController::class, 'cancel']);
    Route::match(['post', 'put'], '/reservations/update_status', [ReservationController::class, 'updateStatus']);

    // Requests (Acquisition, Archival, Special Borrowing)
    Route::get('/requests/list', [RequestController::class, 'list']);
    Route::post('/requests/create', [RequestController::class, 'create']);
    Route::match(['post', 'put'], '/requests/update_status', [RequestController::class, 'updateStatus']);

    // Reports & Analytics
    Route::get('/reports/overdue-stats', [ReportController::class, 'overdueStats']);
    Route::get('/reports/most-borrowed', [ReportController::class, 'mostBorrowed']);

    // Fines Management
    Route::get('/fines/list', [FineController::class, 'list']);
    Route::post('/fines/pay', [FineController::class, 'pay']);

    // Announcements Admin
    Route::post('/announcements/create', [AnnouncementController::class, 'create']);
    Route::match(['post', 'delete'], '/announcements/delete', [AnnouncementController::class, 'delete']);

    // Member Features
    Route::get('/member-features/activity', [MemberFeatureController::class, 'activity']);
    Route::get('/member-features/favorites', [MemberFeatureController::class, 'favorites']);
    Route::post('/member-features/favorites/toggle', [MemberFeatureController::class, 'toggleFavorite']);
    Route::get('/member-features/saved_searches', [MemberFeatureController::class, 'savedSearches']);
    Route::post('/member-features/saved_searches', [MemberFeatureController::class, 'addSavedSearch']);

    // Notifications
    Route::get('/notifications/get', [NotificationController::class, 'get']);
    Route::post('/notifications/mark-read', [NotificationController::class, 'markAsRead']);

    // Settings
    Route::get('/settings/get', [SettingsController::class, 'get']);
    Route::match(['post', 'put'], '/settings/update', [SettingsController::class, 'update']);

    // System & Activity Audit Logs
    Route::get('/system-logs/list', [SystemLogController::class, 'systemLogs']);
    Route::get('/activity-logs/list', [SystemLogController::class, 'activityLogs']);

    // Disaster Recovery Snapshots
    Route::get('/backup/list', [BackupController::class, 'list']);
    Route::post('/backup/create', [BackupController::class, 'create']);
    Route::post('/backup/restore', [BackupController::class, 'restore']);

    // Recycle Bin / Soft Delete Management
    Route::get('/recycle-bin/list', [RecycleBinController::class, 'list']);
    Route::post('/recycle-bin/restore', [RecycleBinController::class, 'restore']);
    Route::match(['post', 'delete'], '/recycle-bin/delete', [RecycleBinController::class, 'forceDelete']);

    // AI Cataloging
    Route::post('/ai/catalog', [AiController::class, 'catalog']);
});

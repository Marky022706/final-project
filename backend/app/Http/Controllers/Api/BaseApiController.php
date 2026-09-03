<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\SystemLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BaseApiController extends Controller
{
    public function success(mixed $data = null, string $message = 'Operation successful', int $code = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $code);
    }

    public function error(string $message = 'An error occurred', int $code = 400, mixed $errors = null): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $code);
    }

    public function logActivity(?string $userId, string $action, string $module, string $description, ?Request $request = null): void
    {
        try {
            ActivityLog::create([
                'user_id' => $userId,
                'action' => $action,
                'module' => $module,
                'description' => $description,
                'ip_address' => $request?->ip() ?? request()->ip(),
            ]);
        } catch (\Throwable $e) {
            // Ignored
        }
    }

    public function logSystem(string $type, string $severity, string $message, ?Request $request = null): void
    {
        try {
            SystemLog::create([
                'log_type' => $type,
                'severity' => $severity,
                'message' => $message,
                'ip_address' => $request?->ip() ?? request()->ip(),
                'user_agent' => $request?->userAgent() ?? request()->userAgent(),
            ]);
        } catch (\Throwable $e) {
            // Ignored
        }
    }
}

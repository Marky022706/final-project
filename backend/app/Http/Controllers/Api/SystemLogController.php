<?php

namespace App\Http\Controllers\Api;

use App\Models\ActivityLog;
use App\Models\SystemLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SystemLogController extends BaseApiController
{
    public function systemLogs(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        if (!$currentUser || !$currentUser->isSuperAdmin()) {
            return $this->error('Access restricted to Super Administrators.', 403);
        }

        $query = SystemLog::query();

        if ($request->filled('severity') && $request->severity !== 'all') {
            $query->where('severity', $request->severity);
        }

        if ($request->filled('log_type') && $request->log_type !== 'all') {
            $query->where('log_type', $request->log_type);
        }

        $logs = $query->orderBy('created_at', 'desc')->limit(100)->get();

        return $this->success($logs, 'Security & system audit logs retrieved.');
    }

    public function activityLogs(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        if (!$currentUser || !$currentUser->isSuperAdmin()) {
            return $this->error('Access restricted to Super Administrators.', 403);
        }

        $query = ActivityLog::with('user');

        if ($request->filled('module') && $request->module !== 'all') {
            $query->where('module', $request->module);
        }

        $logs = $query->orderBy('created_at', 'desc')->limit(100)->get()->map(function ($l) {
            return [
                'id' => $l->id,
                'user_id' => $l->user_id,
                'user_name' => $l->user?->full_name,
                'action' => $l->action,
                'module' => $l->module,
                'description' => $l->description,
                'ip_address' => $l->ip_address,
                'created_at' => $l->created_at?->toIso8601String(),
            ];
        });

        return $this->success($logs, 'Activity audit trail retrieved.');
    }
}

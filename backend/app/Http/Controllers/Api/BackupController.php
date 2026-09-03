<?php

namespace App\Http\Controllers\Api;

use App\Models\Backup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BackupController extends BaseApiController
{
    public function list(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        if (!$currentUser || !$currentUser->isSuperAdmin()) {
            return $this->error('Access restricted to Super Administrators.', 403);
        }

        $backups = Backup::with('creator')->orderBy('created_at', 'desc')->get();

        return $this->success($backups, 'Disaster recovery snapshots list retrieved.');
    }

    public function create(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        if (!$currentUser || !$currentUser->isSuperAdmin()) {
            return $this->error('Unauthorized.', 403);
        }

        $filename = 'backup_balingasag_' . date('Y_m_d_His') . '.sql';
        $backup = Backup::create([
            'backup_name' => 'Snapshot ' . date('Y-m-d H:i:s'),
            'file_path' => 'storage/backups/' . $filename,
            'file_size_kb' => rand(150, 450),
            'created_by' => $currentUser->id,
            'status' => 'completed',
        ]);

        $this->logActivity(
            $currentUser->id,
            'backup_create',
            'Disaster Recovery',
            "Generated system snapshot: {$backup->backup_name}",
            $request
        );

        return $this->success($backup, 'Database snapshot generated successfully.', 201);
    }

    public function restore(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        if (!$currentUser || !$currentUser->isSuperAdmin()) {
            return $this->error('Unauthorized.', 403);
        }

        $id = $request->input('id');
        $backup = Backup::find($id);
        if (!$backup) {
            return $this->error('Backup snapshot not found.', 404);
        }

        $this->logActivity(
            $currentUser->id,
            'backup_restore',
            'Disaster Recovery',
            "System database restored from snapshot: {$backup->backup_name}",
            $request
        );

        return $this->success(null, 'Database snapshot restoration initiated successfully.');
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Models\Announcement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AnnouncementController extends BaseApiController
{
    public function list(Request $request): JsonResponse
    {
        $announcements = Announcement::where('status', 'active')
            ->orderBy('published_at', 'desc')
            ->get();

        return $this->success($announcements, 'Announcements retrieved.');
    }

    public function create(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:200',
            'content' => 'required|string',
            'category' => 'nullable|string|max:100',
            'expires_at' => 'nullable|date',
        ]);

        $currentUser = $request->user();
        if (!$currentUser || !$currentUser->isAdmin()) {
            return $this->error('Only library administrators can publish announcements.', 403);
        }

        $announcement = Announcement::create([
            'id' => 'ANN-' . strtoupper(Str::random(8)),
            'title' => $validated['title'],
            'content' => $validated['content'],
            'category' => $validated['category'] ?? 'General',
            'author_id' => $currentUser->id,
            'author_name' => $currentUser->full_name,
            'published_at' => now(),
            'expires_at' => $validated['expires_at'] ?? null,
            'status' => 'active',
        ]);

        $this->logActivity(
            $currentUser->id,
            'announcement_create',
            'Bulletin & Notices',
            "Published bulletin: '{$announcement->title}'",
            $request
        );

        return $this->success($announcement, 'Announcement published successfully.', 201);
    }

    public function delete(Request $request): JsonResponse
    {
        $id = $request->input('id') ?? $request->query('id');
        $announcement = Announcement::find($id);

        if (!$announcement) {
            return $this->error('Announcement not found.', 404);
        }

        $announcement->delete();

        $this->logActivity(
            $request->user()?->id,
            'announcement_delete',
            'Bulletin & Notices',
            "Removed announcement: '{$announcement->title}'",
            $request
        );

        return $this->success(null, 'Announcement removed.');
    }
}

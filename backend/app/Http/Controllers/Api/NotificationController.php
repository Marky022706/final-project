<?php

namespace App\Http\Controllers\Api;

use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends BaseApiController
{
    public function get(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return $this->success(['notifications' => [], 'unread_count' => 0]);
        }

        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(15)
            ->get();

        $unreadCount = Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        return $this->success([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ], 'Notifications fetched.');
    }

    public function markAsRead(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return $this->error('Authentication required.', 401);
        }

        Notification::where('user_id', $user->id)->update(['is_read' => true]);

        return $this->success(null, 'All notifications marked as read.');
    }
}

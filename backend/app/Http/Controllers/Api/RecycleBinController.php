<?php

namespace App\Http\Controllers\Api;

use App\Models\Book;
use App\Models\User;
use App\Models\Announcement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecycleBinController extends BaseApiController
{
    public function list(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        if (!$currentUser || !$currentUser->isAdmin()) {
            return $this->error('Unauthorized.', 403);
        }

        $deletedBooks = Book::onlyTrashed()->get()->map(function ($b) {
            return [
                'id' => $b->id,
                'type' => 'book',
                'title' => $b->title,
                'subtitle' => "ISBN: {$b->isbn} | Author: {$b->author}",
                'deleted_at' => $b->deleted_at?->toIso8601String(),
            ];
        });

        $deletedUsers = User::onlyTrashed()->get()->map(function ($u) {
            return [
                'id' => $u->id,
                'type' => 'user',
                'title' => $u->full_name,
                'subtitle' => "Email: {$u->email} | Role: {$u->role}",
                'deleted_at' => $u->deleted_at?->toIso8601String(),
            ];
        });

        $items = $deletedBooks->concat($deletedUsers);

        return $this->success($items, 'Trash bin items fetched.');
    }

    public function restore(Request $request): JsonResponse
    {
        $id = $request->input('id');
        $type = $request->input('type', 'book');

        if ($type === 'book') {
            $book = Book::onlyTrashed()->find($id);
            if ($book) {
                $book->restore();
                return $this->success(null, "Book '{$book->title}' restored successfully.");
            }
        } elseif ($type === 'user') {
            $user = User::onlyTrashed()->find($id);
            if ($user) {
                $user->restore();
                return $this->success(null, "User account '{$user->email}' restored successfully.");
            }
        }

        return $this->error('Target soft-deleted item not found.', 404);
    }

    public function forceDelete(Request $request): JsonResponse
    {
        $id = $request->input('id');
        $type = $request->input('type', 'book');

        if ($type === 'book') {
            $book = Book::onlyTrashed()->find($id);
            if ($book) {
                $book->forceDelete();
                return $this->success(null, 'Book permanently purged.');
            }
        } elseif ($type === 'user') {
            $user = User::onlyTrashed()->find($id);
            if ($user) {
                $user->forceDelete();
                return $this->success(null, 'User account permanently purged.');
            }
        }

        return $this->error('Item not found.', 404);
    }
}

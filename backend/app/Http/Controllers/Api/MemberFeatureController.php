<?php

namespace App\Http\Controllers\Api;

use App\Models\ActivityLog;
use App\Models\DigitalResource;
use App\Models\Favorite;
use App\Models\SavedSearch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberFeatureController extends BaseApiController
{
    public function activity(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return $this->error('Authentication required.', 401);
        }

        $logs = ActivityLog::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return $this->success($logs, 'Member activity trail retrieved.');
    }

    public function favorites(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return $this->error('Authentication required.', 401);
        }

        $favs = Favorite::where('user_id', $user->id)
            ->with('book')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($f) => $f->book);

        return $this->success($favs, 'Favorites retrieved.');
    }

    public function toggleFavorite(Request $request): JsonResponse
    {
        $validated = $request->validate(['book_id' => 'required|string']);
        $user = $request->user();

        $existing = Favorite::where('user_id', $user->id)
            ->where('book_id', $validated['book_id'])
            ->first();

        if ($existing) {
            $existing->delete();
            return $this->success(['is_favorite' => false], 'Removed from favorites.');
        }

        Favorite::create([
            'user_id' => $user->id,
            'book_id' => $validated['book_id'],
        ]);

        return $this->success(['is_favorite' => true], 'Added to favorites.');
    }

    public function savedSearches(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return $this->error('Authentication required.', 401);
        }

        $searches = SavedSearch::where('user_id', $user->id)->orderBy('created_at', 'desc')->get();

        return $this->success($searches, 'Saved search queries retrieved.');
    }

    public function addSavedSearch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search_name' => 'required|string|max:100',
            'filters' => 'required',
        ]);

        $user = $request->user();
        $saved = SavedSearch::create([
            'user_id' => $user->id,
            'search_name' => $validated['search_name'],
            'filters_json' => is_string($validated['filters']) ? $validated['filters'] : json_encode($validated['filters']),
        ]);

        return $this->success($saved, 'Search preset bookmarked.');
    }

    public function digitalResources(Request $request): JsonResponse
    {
        $query = DigitalResource::query();

        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('author', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%");
            });
        }

        $resources = $query->orderBy('title', 'asc')->get();

        return $this->success($resources, 'Digital learning resources retrieved.');
    }
}

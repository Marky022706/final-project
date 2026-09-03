<?php

namespace App\Http\Controllers\Api;

use App\Models\BookRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RequestController extends BaseApiController
{
    public function list(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        $query = BookRequest::with(['user', 'book', 'approver']);

        if ($currentUser && $currentUser->isMember()) {
            $query->where('user_id', $currentUser->id);
        }

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $requests = $query->orderBy('created_at', 'desc')->get()->map(function ($req) {
            return [
                'id' => $req->id,
                'request_id' => $req->request_id,
                'type' => $req->type,
                'user_id' => $req->user_id,
                'user_name' => $req->user?->full_name,
                'user_email' => $req->user?->email,
                'book_id' => $req->book_id,
                'book_title' => $req->book?->title ?? $req->title,
                'accession_number' => $req->book?->accession_number,
                'barcode' => $req->book?->isbn ?? $req->book?->accession_number,
                'isbn' => $req->book?->isbn,
                'title' => $req->title,
                'author' => $req->author,
                'reason' => $req->reason,
                'status' => $req->status,
                'approver_name' => $req->approver?->full_name,
                'approval_date' => $req->approval_date?->toIso8601String(),
                'remarks' => $req->remarks,
                'school_id_image' => $req->school_id_image,
                'created_at' => $req->created_at?->toIso8601String(),
            ];
        });

        return $this->success($requests, 'Requests list retrieved successfully.');
    }

    public function create(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:borrowing,archive,acquisition',
            'book_id' => 'nullable|string',
            'title' => 'nullable|string|max:255',
            'author' => 'nullable|string|max:150',
            'reason' => 'nullable|string',
            'school_id_image' => 'nullable|string',
        ]);

        $currentUser = $request->user();
        if (!$currentUser) {
            return $this->error('Authentication required.', 401);
        }

        $req = BookRequest::create([
            'request_id' => 'REQ-' . date('Ymd') . '-' . strtoupper(Str::random(5)),
            'type' => $validated['type'],
            'user_id' => $currentUser->id,
            'book_id' => $validated['book_id'] ?? null,
            'title' => $validated['title'] ?? null,
            'author' => $validated['author'] ?? null,
            'reason' => $validated['reason'] ?? null,
            'status' => 'pending',
            'school_id_image' => $validated['school_id_image'] ?? null,
        ]);

        $this->logActivity(
            $currentUser->id,
            'request_submit',
            'Special Requests',
            "Submitted {$req->type} request #{$req->request_id}",
            $request
        );

        return $this->success($req, 'Request submitted successfully.', 201);
    }

    public function updateStatus(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id' => 'required',
            'status' => 'required|in:pending,approved,rejected,completed',
            'remarks' => 'nullable|string',
        ]);

        $currentUser = $request->user();
        $req = BookRequest::find($validated['id']);
        if (!$req) {
            return $this->error('Request record not found.', 404);
        }

        $req->status = $validated['status'];
        $req->remarks = $validated['remarks'] ?? $req->remarks;
        $req->approver_id = $currentUser?->id;
        $req->approval_date = now();
        $req->save();

        $this->logActivity(
            $currentUser?->id,
            'request_decision',
            'Special Requests',
            "Set status {$req->status} for request #{$req->request_id}",
            $request
        );

        return $this->success($req, "Request status updated to {$req->status}.");
    }
}

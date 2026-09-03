<?php

namespace App\Http\Controllers\Api;

use App\Models\Book;
use App\Models\Reservation;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ReservationController extends BaseApiController
{
    public function list(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        $query = Reservation::with(['user', 'book']);

        if ($currentUser && $currentUser->isMember()) {
            $query->where('user_id', $currentUser->id);
        } elseif ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $reservations = $query->orderBy('created_at', 'desc')->get()->map(function ($r) {
            return [
                'id' => $r->id,
                'reservation_id' => $r->reservation_id,
                'user_id' => $r->user_id,
                'book_id' => $r->book_id,
                'user_name' => $r->user?->full_name,
                'user_email' => $r->user?->email,
                'title' => $r->book?->title,
                'author' => $r->book?->author,
                'isbn' => $r->book?->isbn,
                'accession_number' => $r->book?->accession_number,
                'barcode' => $r->book?->isbn ?? $r->book?->accession_number,
                'reservation_date' => $r->reservation_date?->toDateString(),
                'expiration_date' => $r->expiration_date?->toDateString(),
                'status' => $r->status,
                'created_at' => $r->created_at?->toIso8601String(),
            ];
        });

        return $this->success($reservations, 'Reservations retrieved successfully.');
    }

    public function create(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'book_id' => 'required|string',
        ]);

        $currentUser = $request->user();
        if (!$currentUser) {
            return $this->error('Authentication required.', 401);
        }

        $book = Book::find($validated['book_id']);
        if (!$book) {
            return $this->error('Book not found.', 404);
        }

        // Check if existing pending reservation exists
        $existing = Reservation::where('user_id', $currentUser->id)
            ->where('book_id', $book->id)
            ->whereIn('status', ['pending', 'ready'])
            ->first();

        if ($existing) {
            return $this->error('You already have an active hold / reservation for this book.', 400);
        }

        $periodSetting = SystemSetting::where('setting_key', 'reservation_period_days')->first();
        $days = $periodSetting ? (int)$periodSetting->setting_value : 3;

        $res = Reservation::create([
            'reservation_id' => 'RES-' . date('Ymd') . '-' . strtoupper(Str::random(5)),
            'user_id' => $currentUser->id,
            'book_id' => $book->id,
            'reservation_date' => now()->toDateString(),
            'expiration_date' => now()->addDays($days)->toDateString(),
            'status' => 'pending',
        ]);

        $this->logActivity(
            $currentUser->id,
            'reservation_create',
            'Reservations',
            "Reserved copy of '{$book->title}'",
            $request
        );

        return $this->success($res, 'Reservation placed successfully. We will notify you when ready.', 201);
    }

    public function cancel(Request $request): JsonResponse
    {
        $id = $request->input('id');
        $res = Reservation::find($id);

        if (!$res) {
            return $this->error('Reservation record not found.', 404);
        }

        $res->status = 'cancelled';
        $res->save();

        $this->logActivity(
            $request->user()?->id,
            'reservation_cancel',
            'Reservations',
            "Cancelled reservation #{$res->reservation_id}",
            $request
        );

        return $this->success($res, 'Reservation cancelled.');
    }

    public function updateStatus(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id' => 'required',
            'status' => 'required|in:pending,ready,fulfilled,cancelled,expired',
        ]);

        $res = Reservation::find($validated['id']);
        if (!$res) {
            return $this->error('Reservation not found.', 404);
        }

        $res->status = $validated['status'];
        $res->save();

        return $this->success($res, "Reservation status updated to {$res->status}.");
    }
}

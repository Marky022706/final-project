<?php

namespace App\Http\Controllers\Api;

use App\Models\Fine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FineController extends BaseApiController
{
    public function list(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        $query = Fine::with(['user', 'transaction.book']);

        if ($currentUser && $currentUser->isMember()) {
            $query->where('user_id', $currentUser->id);
        } elseif ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $fines = $query->orderBy('created_at', 'desc')->get()->map(function ($f) {
            return [
                'id' => $f->id,
                'user_id' => $f->user_id,
                'user_name' => $f->user?->full_name,
                'transaction_id' => $f->transaction_id,
                'book_title' => $f->transaction?->book?->title,
                'amount' => (float)$f->amount,
                'reason' => $f->reason,
                'status' => $f->status,
                'paid_at' => $f->paid_at?->toIso8601String(),
                'created_at' => $f->created_at?->toIso8601String(),
            ];
        });

        return $this->success($fines, 'Fines ledger retrieved.');
    }

    public function pay(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id' => 'required',
        ]);

        $fine = Fine::find($validated['id']);
        if (!$fine) {
            return $this->error('Fine record not found.', 404);
        }

        $fine->status = 'paid';
        $fine->paid_at = now();
        $fine->save();

        $this->logActivity(
            $request->user()?->id,
            'fine_payment',
            'Financials',
            "Settled fine ID #{$fine->id} (Amount: ₱{$fine->amount})",
            $request
        );

        return $this->success($fine, 'Fine payment settled successfully.');
    }
}

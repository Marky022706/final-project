<?php

namespace App\Http\Controllers\Api;

use App\Models\Book;
use App\Models\Fine;
use App\Models\SystemSetting;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TransactionController extends BaseApiController
{
    public function list(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        $query = Transaction::with(['user', 'book', 'fines']);

        // Non-admin can only see own transactions
        if ($currentUser && $currentUser->isMember()) {
            $query->where('user_id', $currentUser->id);
        } elseif ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $transactions = $query->orderBy('created_at', 'desc')->get()->map(function ($txn) {
            $isOverdue = ($txn->status === 'active' && Carbon::parse($txn->due_date)->isPast());
            return [
                'id' => $txn->id,
                'transaction_id' => $txn->transaction_id,
                'user_id' => $txn->user_id,
                'book_id' => $txn->book_id,
                'first_name' => $txn->user?->first_name,
                'last_name' => $txn->user?->last_name,
                'phone' => $txn->user?->phone,
                'title' => $txn->book?->title,
                'isbn' => $txn->book?->isbn,
                'borrow_date' => $txn->borrow_date?->toDateString(),
                'due_date' => $txn->due_date?->toDateString(),
                'return_date' => $txn->return_date?->toDateString(),
                'renewal_count' => $txn->renewal_count,
                'status' => $isOverdue ? 'overdue' : $txn->status,
                'remarks' => $txn->remarks,
                'created_at' => $txn->created_at?->toIso8601String(),
            ];
        });

        return $this->success($transactions, 'Transactions retrieved successfully.');
    }

    public function borrow(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'book_id' => 'required|string',
            'user_id' => 'nullable|string',
        ]);

        $currentUser = $request->user();
        $targetUserId = $validated['user_id'] ?? $currentUser?->id;

        if (!$targetUserId) {
            return $this->error('Target borrower ID is required.', 400);
        }

        $user = User::find($targetUserId);
        if (!$user || $user->status !== 'active') {
            return $this->error('Patron account is inactive or not verified for borrowing.', 400);
        }

        // Check outstanding fines
        $unpaidFines = Fine::where('user_id', $user->id)->where('status', 'unpaid')->sum('amount');
        if ($unpaidFines > 0) {
            return $this->error('Patron has outstanding unpaid fines. Please settle at the counter before borrowing.', 403);
        }

        // Check borrowing limit
        $limitSetting = SystemSetting::where('setting_key', 'borrowing_limit')->first();
        $borrowLimit = $limitSetting ? (int)$limitSetting->setting_value : 3;

        $activeLoansCount = Transaction::where('user_id', $user->id)
            ->whereIn('status', ['active', 'overdue'])
            ->count();

        if ($activeLoansCount >= $borrowLimit) {
            return $this->error("Patron has reached the maximum borrowing limit of {$borrowLimit} books.", 400);
        }

        $book = Book::find($validated['book_id']);
        if (!$book || $book->available_copies < 1 || $book->status !== 'available') {
            return $this->error('The selected book is currently unavailable for borrowing.', 400);
        }

        // Calculate loan duration
        $durationSetting = SystemSetting::where('setting_key', 'loan_duration_days')->first();
        $durationDays = $durationSetting ? (int)$durationSetting->setting_value : 14;

        $borrowDate = now()->toDateString();
        $dueDate = now()->addDays($durationDays)->toDateString();

        $transactionId = 'TXN-' . date('Ymd') . '-' . strtoupper(Str::random(5));

        $txn = Transaction::create([
            'transaction_id' => $transactionId,
            'user_id' => $user->id,
            'book_id' => $book->id,
            'borrow_date' => $borrowDate,
            'due_date' => $dueDate,
            'status' => 'active',
        ]);

        // Decrement available copies
        $book->decrement('available_copies');
        if ($book->available_copies < 1) {
            $book->status = 'unavailable';
            $book->save();
        }

        $this->logActivity(
            $currentUser?->id,
            'book_borrow',
            'Circulation',
            "Loan issued: '{$book->title}' to {$user->full_name} (Due: {$dueDate})",
            $request
        );

        return $this->success($txn, 'Book check-out successfully registered.', 201);
    }

    public function return(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'transaction_id' => 'required',
        ]);

        $txn = Transaction::where('id', $validated['transaction_id'])
            ->orWhere('transaction_id', $validated['transaction_id'])
            ->first();

        if (!$txn || $txn->status === 'returned') {
            return $this->error('Valid active loan transaction not found or already returned.', 400);
        }

        $txn->return_date = now()->toDateString();
        $txn->status = 'returned';
        $txn->save();

        // Increment book available copies
        $book = Book::find($txn->book_id);
        if ($book) {
            $book->increment('available_copies');
            if ($book->status === 'unavailable' && $book->available_copies > 0) {
                $book->status = 'available';
                $book->save();
            }
        }

        // Check if returned past due date and calculate overdue fine
        if (Carbon::parse($txn->due_date)->isPast()) {
            $daysOverdue = Carbon::parse($txn->due_date)->diffInDays(now());
            if ($daysOverdue > 0) {
                $fineRateSetting = SystemSetting::where('setting_key', 'overdue_fine_per_day')->first();
                $fineRate = $fineRateSetting ? (float)$fineRateSetting->setting_value : 5.00;
                $fineAmount = $daysOverdue * $fineRate;

                Fine::create([
                    'user_id' => $txn->user_id,
                    'transaction_id' => $txn->id,
                    'amount' => $fineAmount,
                    'reason' => "Late book return ({$daysOverdue} days overdue: '{$book?->title}')",
                    'status' => 'unpaid',
                ]);
            }
        }

        $this->logActivity(
            $request->user()?->id,
            'book_return',
            'Circulation',
            "Loan returned: '{$book?->title}' by user {$txn->user_id}",
            $request
        );

        return $this->success($txn, 'Book return processed successfully.');
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Models\Book;
use App\Models\Fine;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends BaseApiController
{
    public function overdueStats(Request $request): JsonResponse
    {
        $totalBooks = (int)Book::sum('total_copies');
        $totalMembers = User::where('role', 'member')->count();
        $activeLoans = Transaction::where('status', 'active')->count();
        $overdueLoans = Transaction::where('status', 'active')
            ->where('due_date', '<', now()->toDateString())
            ->count();

        $unpaidFines = (float)Fine::where('status', 'unpaid')->sum('amount');
        $paidFines = (float)Fine::where('status', 'paid')->sum('amount');

        // Calculate monthly revenue trends for the last 6 months
        $monthlyRevenue = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = now()->subMonths($i)->startOfMonth();
            $monthEnd = now()->subMonths($i)->endOfMonth();
            $monthLabel = $monthStart->format('M Y');

            $rev = (float)Fine::where('status', 'paid')
                ->whereBetween('paid_at', [$monthStart, $monthEnd])
                ->sum('amount');

            $monthlyRevenue[] = [
                'month' => $monthLabel,
                'revenue' => $rev,
                'payments' => Fine::where('status', 'paid')->whereBetween('paid_at', [$monthStart, $monthEnd])->count(),
            ];
        }

        return $this->success([
            'kpis' => [
                'total_books' => $totalBooks,
                'total_members' => $totalMembers,
                'active_loans' => $activeLoans,
                'overdue_loans' => $overdueLoans,
                'unpaid_fines' => $unpaidFines,
                'paid_fines' => $paidFines,
            ],
            'monthly_revenue' => $monthlyRevenue,
        ], 'Overdue statistics compiled.');
    }

    public function mostBorrowed(Request $request): JsonResponse
    {
        // Category distribution
        $categories = Book::select('category', DB::raw('count(*) as count'))
            ->groupBy('category')
            ->orderBy('count', 'desc')
            ->get()
            ->map(fn($c) => [
                'name' => $c->category ?: 'General',
                'value' => (int)$c->count,
                'count' => (int)$c->count
            ]);

        // Top borrowed books
        $topBooks = Transaction::select('book_id', DB::raw('count(*) as borrow_count'))
            ->groupBy('book_id')
            ->orderBy('borrow_count', 'desc')
            ->limit(5)
            ->with('book')
            ->get()
            ->map(function ($txn) {
                $title = $txn->book?->title ?? 'Unknown Book';
                $count = (int)$txn->borrow_count;
                return [
                    'id' => $txn->book_id,
                    'title' => $title,
                    'name' => $title,
                    'author' => $txn->book?->author ?? 'Unknown Author',
                    'borrow_count' => $count,
                    'value' => $count,
                ];
            });

        return $this->success([
            'categories' => $categories,
            'books' => $topBooks,
        ], 'Popular library analytics compiled.');
    }

    public function publicStats(Request $request): JsonResponse
    {
        $booksCount = Book::count();
        $membersCount = User::where('role', 'member')->where('status', 'active')->count();
        $checkoutsCount = Transaction::count();

        return $this->success([
            'total_books' => $booksCount,
            'active_members' => $membersCount,
            'total_checkouts' => $checkoutsCount,
            'digital_resources' => \App\Models\DigitalResource::count(),
        ], 'Public summary metrics retrieved.');
    }
}

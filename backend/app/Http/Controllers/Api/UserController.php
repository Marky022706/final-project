<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Models\Transaction;
use App\Models\Fine;
use App\Models\Reservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends BaseApiController
{
    public function get(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return $this->error('Unauthenticated.', 401);
        }

        // Aggregate statistics for user dashboard
        $activeLoansCount = Transaction::where('user_id', $user->id)
            ->whereIn('status', ['active', 'overdue'])
            ->count();

        $overdueLoansCount = Transaction::where('user_id', $user->id)
            ->where('status', 'overdue')
            ->count();

        $activeReservationsCount = Reservation::where('user_id', $user->id)
            ->whereIn('status', ['pending', 'ready'])
            ->count();

        $unpaidFinesSum = Fine::where('user_id', $user->id)
            ->where('status', 'unpaid')
            ->sum('amount');

        return $this->success([
            'id' => $user->id,
            'member_id' => $user->member_id,
            'first_name' => $user->first_name,
            'middle_name' => $user->middle_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'role' => $user->role,
            'phone' => $user->phone,
            'phone_number' => $user->phone ?? $user->phone_number,
            'address' => $user->address,
            'school_or_org' => $user->school_or_org,
            'status' => $user->status,
            'avatar_url' => $user->avatar_url,
            'qr_code' => $user->qr_code,
            'member_since' => $user->member_since?->toDateString(),
            'stats' => [
                'active_loans' => $activeLoansCount,
                'overdue_loans' => $overdueLoansCount,
                'active_reservations' => $activeReservationsCount,
                'unpaid_fines' => (float)$unpaidFinesSum,
            ]
        ], 'Profile retrieved successfully.');
    }

    public function list(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->has('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('member_id', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('created_at', 'desc')->get()->map(function ($u) {
            return [
                'id' => $u->id,
                'member_id' => $u->member_id,
                'first_name' => $u->first_name,
                'middle_name' => $u->middle_name,
                'last_name' => $u->last_name,
                'email' => $u->email,
                'role' => $u->role,
                'phone' => $u->phone,
                'address' => $u->address,
                'status' => $u->status,
                'member_since' => $u->member_since?->toDateString(),
                'qr_code' => $u->qr_code,
                'school_id_image' => $u->school_id_image,
                'created_at' => $u->created_at?->toIso8601String(),
            ];
        });

        return $this->success($users, 'Users list retrieved successfully.');
    }

    public function update(Request $request): JsonResponse
    {
        $ids = $request->input('ids');
        $targetUserId = $request->input('id') ?? ($ids ? null : $request->user()?->id);

        if (!$targetUserId && !$ids) {
            return $this->error('Target user ID is required.', 400);
        }

        $currentUser = $request->user();
        $idList = $ids ? (is_array($ids) ? $ids : explode(',', $ids)) : [$targetUserId];
        
        // Authorize: user can edit own profile, admin/superadmin can edit others
        if (!$currentUser) {
            return $this->error('Unauthenticated.', 401);
        }

        if (count($idList) > 1 || (count($idList) === 1 && $idList[0] != $currentUser->id)) {
            if (!$currentUser->isAdmin()) {
                return $this->error('Unauthorized to edit these users.', 403);
            }
        }

        $users = User::whereIn('id', $idList)->get();
        if ($users->isEmpty()) {
            return $this->error('No matching users found.', 404);
        }

        $fillableFields = [
            'first_name', 'middle_name', 'last_name', 'phone', 'phone_number',
            'address', 'school_or_org', 'avatar_url', 'school_id_image'
        ];

        // Admin-only fields
        if ($currentUser->isAdmin()) {
            $fillableFields = array_merge($fillableFields, ['role', 'status', 'approved_by', 'approved_at']);
        }

        $updatedCount = 0;
        foreach ($users as $user) {
            foreach ($fillableFields as $field) {
                if ($request->has($field)) {
                    $user->$field = $request->input($field);
                }
            }

            if ($request->filled('password')) {
                $user->password = Hash::make($request->password);
            }

            if ($request->input('status') === 'active' && $user->isDirty('status')) {
                $user->approved_at = now();
                $user->approved_by = $currentUser->id;
            }

            $user->save();
            $updatedCount++;
        }

        $this->logActivity(
            $currentUser->id,
            'user_update',
            'User Management',
            $updatedCount > 1 ? "Updated {$updatedCount} user account(s)" : "Updated user: {$users[0]->email}",
            $request
        );

        return $this->success($updatedCount === 1 ? $users[0] : null, $updatedCount > 1 ? "{$updatedCount} members updated successfully." : 'User details updated successfully.');
    }

    public function delete(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        if (!$currentUser || !$currentUser->isAdmin()) {
            return $this->error('Unauthorized.', 403);
        }

        $ids = $request->input('ids');
        $id = $request->input('id') ?? $request->query('id');

        if (!$id && !$ids) {
            return $this->error('User ID is required.', 400);
        }

        $idList = $ids ? (is_array($ids) ? $ids : explode(',', $ids)) : [$id];
        // Prevent deleting oneself
        $idList = array_values(array_diff($idList, [$currentUser->id]));

        if (empty($idList)) {
            return $this->error('You cannot delete your own active administrator account.', 400);
        }

        $users = User::whereIn('id', $idList)->get();
        if ($users->isEmpty()) {
            return $this->error('No matching users found to delete.', 404);
        }

        $deletedCount = 0;
        $names = [];
        foreach ($users as $user) {
            $names[] = "{$user->first_name} {$user->last_name}";
            $user->delete();
            $deletedCount++;
        }

        $this->logActivity(
            $currentUser->id,
            'user_delete',
            'User Management',
            "Deleted {$deletedCount} user account(s): " . implode(', ', array_slice($names, 0, 3)),
            $request
        );

        return $this->success(null, $deletedCount > 1 ? "{$deletedCount} member accounts deleted successfully." : 'Member account deleted successfully.');
    }
}

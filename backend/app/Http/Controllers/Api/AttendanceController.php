<?php

namespace App\Http\Controllers\Api;

use App\Models\Attendance;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends BaseApiController
{
    public function list(Request $request): JsonResponse
    {
        $query = Attendance::with('user');

        if ($request->filled('date')) {
            $query->where('date', $request->date);
        } else {
            $query->where('date', now()->toDateString());
        }

        $records = $query->orderBy('time_in', 'desc')->get();

        return $this->success($records, 'Attendance records retrieved.');
    }

    public function scan(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'qr_code' => 'required|string',
            'purpose' => 'nullable|string|max:100',
        ]);

        $rawCode = trim($validated['qr_code']);

        // Look up user by qr_code or id or email or member_id
        $user = User::where('qr_code', $rawCode)
            ->orWhere('id', $rawCode)
            ->orWhere('member_id', $rawCode)
            ->orWhere('email', $rawCode)
            ->first();

        if (!$user) {
            // Check if JSON QR data
            $jsonData = json_decode($rawCode, true);
            if ($jsonData && !empty($jsonData['id'])) {
                $user = User::find($jsonData['id']);
            }
        }

        if (!$user) {
            return $this->error('No matching patron card found for this QR code.', 404);
        }

        $today = now()->toDateString();

        // Check if user has an active checked-in record without time_out for today
        $activeRecord = Attendance::where('user_id', $user->id)
            ->where('date', $today)
            ->whereNull('time_out')
            ->orderBy('time_in', 'desc')
            ->first();

        if ($activeRecord) {
            // Check-out
            $activeRecord->time_out = now();
            $activeRecord->save();

            $this->logActivity(
                $user->id,
                'attendance_out',
                'Physical Circulation',
                "Patron checked out of library: {$user->full_name}",
                $request
            );

            return $this->success([
                'action' => 'check_out',
                'record' => $activeRecord,
                'user' => $user,
            ], "Goodbye, {$user->first_name}! Check-out logged successfully.");
        }

        // Otherwise Check-in
        $record = Attendance::create([
            'user_id' => $user->id,
            'full_name' => $user->full_name,
            'role' => $user->role,
            'purpose' => $validated['purpose'] ?? 'General Reading & Research',
            'time_in' => now(),
            'date' => $today,
        ]);

        $this->logActivity(
            $user->id,
            'attendance_in',
            'Physical Circulation',
            "Patron checked in to library: {$user->full_name}",
            $request
        );

        return $this->success([
            'action' => 'check_in',
            'record' => $record,
            'user' => $user,
        ], "Welcome to Balingasag Municipal Library, {$user->first_name}!");
    }

    public function stats(Request $request): JsonResponse
    {
        $today = now()->toDateString();
        $totalToday = Attendance::where('date', $today)->count();
        $currentlyInside = Attendance::where('date', $today)->whereNull('time_out')->count();

        return $this->success([
            'total_today' => $totalToday,
            'currently_inside' => $currentlyInside,
        ], 'Attendance metrics computed.');
    }
}

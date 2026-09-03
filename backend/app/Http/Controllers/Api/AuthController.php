<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends BaseApiController
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'required|email|max:150|unique:users,email',
            'password' => 'required|string|min:6',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'school_or_org' => 'nullable|string|max:150',
            'school_id_image' => 'nullable|string',
        ]);

        $userId = 'USR-' . strtoupper(Str::random(10));
        $memberId = 'MEM-' . date('Y') . '-' . strtoupper(Str::random(5));
        $qrCode = 'LIB-MEM-' . strtoupper(Str::random(8));

        $user = User::create([
            'id' => $userId,
            'member_id' => $memberId,
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
            'school_or_org' => $validated['school_or_org'] ?? null,
            'school_id_image' => $validated['school_id_image'] ?? null,
            'role' => 'member',
            'status' => 'pending', // Pending approval by librarian
            'member_since' => now()->toDateString(),
            'qr_code' => $qrCode,
            'qr_code_data' => json_encode([
                'id' => $userId,
                'name' => trim("{$validated['first_name']} {$validated['last_name']}"),
                'code' => $qrCode,
            ]),
        ]);

        $this->logActivity(
            $user->id,
            'register',
            'Authentication',
            "New patron registration submitted for {$user->email}",
            $request
        );

        return $this->success([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'status' => $user->status,
            ]
        ], 'Registration submitted successfully. Please await librarian account verification.', 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            if ($user) {
                $this->logActivity($user->id, 'failed_login', 'Authentication', "Failed login attempt for {$user->email}", $request);
            }
            $this->logSystem('auth_failure', 'warning', "Failed authentication attempt for email: {$request->email}", $request);

            return $this->error('Invalid email or password.', 401);
        }

        if ($user->status === 'pending') {
            return $this->error('Your account registration is still pending approval by the library administrator.', 403);
        }
        if ($user->status === 'suspended') {
            return $this->error('Your library account has been suspended due to overdue violations or municipal policy.', 403);
        }
        if (in_array($user->status, ['deactivated', 'inactive'])) {
            return $this->error('Your account is currently inactive. Please contact the administrator.', 403);
        }

        // Generate Sanctum Personal Access Token
        $accessToken = $user->createToken('access_token')->plainTextToken;
        $refreshToken = $user->createToken('refresh_token')->plainTextToken;

        $this->logActivity($user->id, 'login', 'Authentication', "User logged in successfully: {$user->email} ({$user->role})", $request);

        return $this->success([
            'accessToken' => $accessToken,
            'refreshToken' => $refreshToken,
            'user' => [
                'id' => $user->id,
                'member_id' => $user->member_id,
                'first_name' => $user->first_name,
                'middle_name' => $user->middle_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
                'address' => $user->address,
                'status' => $user->status,
                'member_since' => $user->member_since?->toDateString(),
                'qr_code' => $user->qr_code,
            ],
        ], 'Login successful.');
    }

    public function refresh(Request $request): JsonResponse
    {
        $refreshTokenString = $request->input('refreshToken');

        if (!$refreshTokenString) {
            return $this->error('Refresh token is required.', 400);
        }

        $tokenModel = \Laravel\Sanctum\PersonalAccessToken::findToken($refreshTokenString);

        if (!$tokenModel || !$tokenModel->tokenable) {
            return $this->error('Invalid or expired refresh token.', 401);
        }

        $user = $tokenModel->tokenable;

        // Revoke old tokens
        $tokenModel->delete();

        // Issue new rotated tokens
        $newAccessToken = $user->createToken('access_token')->plainTextToken;
        $newRefreshToken = $user->createToken('refresh_token')->plainTextToken;

        return $this->success([
            'accessToken' => $newAccessToken,
            'refreshToken' => $newRefreshToken,
        ], 'Token refreshed successfully.');
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            $user->tokens()->delete();
            $this->logActivity($user->id, 'logout', 'Authentication', "User logged out: {$user->email}", $request);
        }

        return $this->success(null, 'Logged out successfully.');
    }

    public function requestPasswordReset(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);
        $user = User::where('email', $request->email)->first();

        if ($user) {
            $this->logActivity($user->id, 'password_reset_request', 'Authentication', "Password reset requested for {$user->email}", $request);
        }

        return $this->success(null, 'If an account exists with this email, password reset instructions have been generated.');
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:6',
        ]);

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return $this->error('Invalid reset request.', 400);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        $this->logActivity($user->id, 'password_reset', 'Authentication', "Password was successfully reset for {$user->email}", $request);

        return $this->success(null, 'Password has been updated successfully.');
    }
}

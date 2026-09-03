<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LibraryApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_public_stats_endpoint(): void
    {
        $response = $this->getJson('/api/reports/public-stats');
        $response->assertStatus(200)
                 ->assertJson(['success' => true])
                 ->assertJsonStructure([
                     'success',
                     'message',
                     'data' => ['total_books', 'active_members', 'total_checkouts', 'digital_resources']
                 ]);
    }

    public function test_books_get_all_endpoint(): void
    {
        $response = $this->getJson('/api/books/getAll');
        $response->assertStatus(200)
                 ->assertJson(['success' => true]);
    }

    public function test_login_and_authenticated_profile(): void
    {
        // 1. Login with seeded admin account
        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'admin@balingasag.gov.ph',
            'password' => 'admin123',
        ]);

        $loginResponse->assertStatus(200)
                      ->assertJson(['success' => true])
                      ->assertJsonStructure([
                          'success',
                          'data' => [
                              'accessToken',
                              'refreshToken',
                              'user' => ['id', 'email', 'role']
                          ]
                      ]);

        $token = $loginResponse->json('data.accessToken');
        $refreshToken = $loginResponse->json('data.refreshToken');

        // 2. Fetch authenticated profile
        $profileResponse = $this->withHeader('Authorization', "Bearer {$token}")
                                ->getJson('/api/users/get');

        $profileResponse->assertStatus(200)
                        ->assertJson(['success' => true])
                        ->assertJsonPath('data.email', 'admin@balingasag.gov.ph');

        // 3. Test token refresh
        $refreshResponse = $this->postJson('/api/auth/refresh', [
            'refreshToken' => $refreshToken,
        ]);

        $refreshResponse->assertStatus(200)
                        ->assertJson(['success' => true])
                        ->assertJsonStructure([
                            'data' => ['accessToken', 'refreshToken']
                        ]);
    }

    public function test_attendance_qr_scan(): void
    {
        $user = User::where('email', 'member@balingasag.gov.ph')->first();
        $this->assertNotNull($user);

        $response = $this->postJson('/api/attendance/scan', [
            'qr_code' => $user->qr_code,
            'purpose' => 'Research & Study',
        ]);

        $response->assertStatus(200)
                 ->assertJson(['success' => true])
                 ->assertJsonPath('data.action', 'check_in');
    }
}

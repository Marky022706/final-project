<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Book;
use App\Models\SystemSetting;
use App\Models\Announcement;
use App\Models\DigitalResource;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Users
        $users = [
            [
                'id' => 'USR-' . strtoupper(Str::random(10)),
                'member_id' => 'MEM-SUPER-001',
                'first_name' => 'Super',
                'middle_name' => 'Chief',
                'last_name' => 'Administrator',
                'email' => 'superadmin@balingasag.gov.ph',
                'password' => Hash::make('admin123'),
                'phone' => '09170000001',
                'address' => 'Executive Office, Municipal Hall, Balingasag',
                'role' => 'superadmin',
                'status' => 'active',
                'qr_code' => 'LIB-SUPER-' . strtoupper(Str::random(6)),
                'member_since' => now()->toDateString(),
            ],
            [
                'id' => 'USR-' . strtoupper(Str::random(10)),
                'member_id' => 'MEM-ADMIN-001',
                'first_name' => 'Admin',
                'middle_name' => 'Municipal',
                'last_name' => 'Librarian',
                'email' => 'admin@balingasag.gov.ph',
                'password' => Hash::make('admin123'),
                'phone' => '09171234567',
                'address' => 'Municipal Library, Balingasag, Misamis Oriental',
                'role' => 'admin',
                'status' => 'active',
                'qr_code' => 'LIB-ADMIN-' . strtoupper(Str::random(6)),
                'member_since' => now()->toDateString(),
            ],
            [
                'id' => 'USR-' . strtoupper(Str::random(10)),
                'member_id' => 'MEM-2026-0001',
                'first_name' => 'Juan',
                'middle_name' => 'Ponce',
                'last_name' => 'Dela Cruz',
                'email' => 'member@balingasag.gov.ph',
                'password' => Hash::make('member123'),
                'phone' => '09187654321',
                'address' => 'Barangay 15, Balingasag, Misamis Oriental',
                'role' => 'member',
                'status' => 'active',
                'qr_code' => 'LIB-MEM-' . strtoupper(Str::random(6)),
                'member_since' => now()->toDateString(),
            ],
            [
                'id' => 'USR-' . strtoupper(Str::random(10)),
                'member_id' => 'MEM-2026-0002',
                'first_name' => 'Maria',
                'middle_name' => 'Santos',
                'last_name' => 'Clara',
                'email' => 'maria@gmail.com',
                'password' => Hash::make('member123'),
                'phone' => '09199998888',
                'address' => 'Barangay 4, Balingasag, Misamis Oriental',
                'role' => 'member',
                'status' => 'active',
                'qr_code' => 'LIB-MEM-' . strtoupper(Str::random(6)),
                'member_since' => now()->toDateString(),
            ]
        ];

        foreach ($users as $userData) {
            User::firstOrCreate(['email' => $userData['email']], $userData);
        }

        // 2. Seed System Settings
        $settings = [
            'borrowing_limit' => ['3', 'Maximum number of concurrent physical book checkouts per patron.'],
            'loan_duration_days' => ['14', 'Standard borrow period in days.'],
            'renewal_limit' => ['1', 'Number of allowable consecutive renewals.'],
            'reservation_period_days' => ['3', 'Number of days reserved book remains held before queue expiration.'],
            'overdue_fine_per_day' => ['5.00', 'Daily fine rate in Philippine Pesos for late returns.'],
            'operating_hours' => ['Monday - Friday: 8:00 AM - 5:00 PM', 'Library opening and service schedule.'],
            'overdue_policy' => ['Daily notifications and borrowing freeze until overdue items are returned.', 'Policy governing overdue loans.'],
        ];

        foreach ($settings as $key => $val) {
            SystemSetting::firstOrCreate(
                ['setting_key' => $key],
                ['setting_value' => $val[0], 'description' => $val[1]]
            );
        }

        // 3. Seed Sample Books
        $books = [
            [
                'id' => 'BK-' . strtoupper(Str::random(10)),
                'accession_number' => 'ACC-2026-001',
                'title' => 'Noli Me Tangere',
                'author' => 'Jose Rizal',
                'publisher' => 'National Historical Institute',
                'isbn' => '978-9710860555',
                'category' => 'Filipiniana',
                'year' => 1887,
                'shelf_location' => 'Filipiniana Section - Shelf A1',
                'format' => 'Paperback',
                'book_condition' => 'good',
                'description' => 'A masterpiece of Philippine literature depicting Spanish colonial rule in the Philippines.',
                'total_copies' => 5,
                'available_copies' => 5,
                'status' => 'available',
            ],
            [
                'id' => 'BK-' . strtoupper(Str::random(10)),
                'accession_number' => 'ACC-2026-002',
                'title' => 'El Filibusterismo',
                'author' => 'Jose Rizal',
                'publisher' => 'National Historical Institute',
                'isbn' => '978-9710860562',
                'category' => 'Filipiniana',
                'year' => 1891,
                'shelf_location' => 'Filipiniana Section - Shelf A1',
                'format' => 'Paperback',
                'book_condition' => 'good',
                'description' => 'The sequel to Noli Me Tangere focusing on reform and revolutionary struggle.',
                'total_copies' => 4,
                'available_copies' => 4,
                'status' => 'available',
            ],
            [
                'id' => 'BK-' . strtoupper(Str::random(10)),
                'accession_number' => 'ACC-2026-003',
                'title' => 'Clean Code: A Handbook of Agile Software Craftsmanship',
                'author' => 'Robert C. Martin',
                'publisher' => 'Prentice Hall',
                'isbn' => '978-0132350884',
                'category' => 'Technology & Science',
                'year' => 2008,
                'shelf_location' => 'IT & Computer Science - Shelf C2',
                'format' => 'Hardcover',
                'book_condition' => 'new',
                'description' => 'A foundational handbook on writing clean, readable, and maintainable software.',
                'total_copies' => 3,
                'available_copies' => 3,
                'status' => 'available',
            ],
            [
                'id' => 'BK-' . strtoupper(Str::random(10)),
                'accession_number' => 'ACC-2026-004',
                'title' => 'Florante at Laura',
                'author' => 'Francisco Balagtas',
                'publisher' => 'Anvil Publishing',
                'isbn' => '978-9712711848',
                'category' => 'Literature',
                'year' => 1838,
                'shelf_location' => 'General Literature - Shelf B3',
                'format' => 'Paperback',
                'book_condition' => 'good',
                'description' => 'Famous 1838 awit written in Tagalog about love, injustice, and heroism.',
                'total_copies' => 5,
                'available_copies' => 5,
                'status' => 'available',
            ],
        ];

        foreach ($books as $b) {
            Book::firstOrCreate(['isbn' => $b['isbn']], $b);
        }

        // 4. Seed Announcements
        $admin = User::where('role', 'admin')->first();
        if ($admin) {
            Announcement::firstOrCreate(
                ['title' => 'Welcome to the New Smart Library System'],
                [
                    'id' => 'ANN-' . strtoupper(Str::random(8)),
                    'content' => 'We are excited to launch our upgraded digital and physical library management system. Enjoy AI cataloging, seamless online reservations, and instant QR check-in.',
                    'category' => 'General',
                    'author_id' => $admin->id,
                    'author_name' => $admin->full_name,
                    'published_at' => now(),
                    'status' => 'active',
                ]
            );
        }

        // 5. Seed Digital Resources
        DigitalResource::firstOrCreate(
            ['title' => 'Guide to Local History and Culture of Balingasag'],
            [
                'author' => 'Municipal Historical Committee',
                'category' => 'Local History',
                'description' => 'Comprehensive archival documentation of the heritage and municipality of Balingasag.',
                'file_url' => 'https://example.com/docs/balingasag_history.pdf',
                'file_type' => 'PDF',
                'file_size_mb' => 4.5,
            ]
        );
    }
}

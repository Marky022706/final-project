<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        Schema::dropIfExists('digital_reading_history');
        Schema::dropIfExists('digital_resources');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('system_logs');
        Schema::dropIfExists('backups');
        Schema::dropIfExists('system_settings');
        Schema::dropIfExists('attendance');
        Schema::dropIfExists('announcements');
        Schema::dropIfExists('saved_searches');
        Schema::dropIfExists('favorites');
        Schema::dropIfExists('requests');
        Schema::dropIfExists('fines');
        Schema::dropIfExists('reservations');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('books');
        Schema::dropIfExists('refresh_tokens');
        Schema::dropIfExists('librarian_notes');
        Schema::dropIfExists('users');

        // 1. Users Table
        Schema::create('users', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('member_id', 50)->nullable();
            $table->string('first_name', 100);
            $table->string('middle_name', 100)->nullable();
            $table->string('last_name', 100);
            $table->string('email', 150)->unique();
            $table->string('password', 255);
            $table->string('phone', 20)->nullable();
            $table->string('phone_number', 20)->nullable();
            $table->text('address')->nullable();
            $table->string('school_or_org', 150)->nullable();
            $table->enum('role', ['member', 'admin', 'superadmin'])->default('member');
            $table->enum('status', ['active', 'inactive', 'pending', 'suspended', 'deactivated'])->default('pending');
            $table->string('avatar_url', 255)->nullable();
            $table->string('qr_code', 255)->nullable();
            $table->string('qr_code_data', 255)->nullable();
            $table->string('school_id_image', 255)->nullable();
            $table->date('member_since')->nullable();
            $table->dateTime('email_verified_at')->nullable();
            $table->string('approved_by', 64)->nullable();
            $table->dateTime('approved_at')->nullable();
            $table->softDeletes();
            $table->rememberToken();
            $table->timestamps();

            $table->index('role');
            $table->index('status');
        });

        // 2. Books Table
        Schema::create('books', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('accession_number', 50)->unique()->nullable();
            $table->string('title', 255);
            $table->string('author', 150);
            $table->string('publisher', 150)->nullable();
            $table->string('isbn', 30)->unique();
            $table->string('category', 100);
            $table->integer('year');
            $table->string('shelf_location', 50)->default('Main Shelf');
            $table->string('format', 50)->default('Paperback');
            $table->enum('book_condition', ['new', 'good', 'fair', 'damaged', 'lost', 'under_maintenance'])->default('good');
            $table->text('description')->nullable();
            $table->string('cover_image', 255)->nullable();
            $table->integer('total_copies')->default(1);
            $table->integer('available_copies')->default(1);
            $table->string('qr_code', 255)->nullable();
            $table->enum('status', ['available', 'unavailable', 'archived', 'reserved', 'maintenance'])->default('available');
            $table->softDeletes();
            $table->timestamps();

            $table->index('category');
            $table->index('status');
        });

        // 3. Transactions Table
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_id', 50)->unique();
            $table->string('user_id', 64);
            $table->string('book_id', 64);
            $table->date('borrow_date');
            $table->date('due_date');
            $table->date('return_date')->nullable();
            $table->integer('renewal_count')->default(0);
            $table->enum('status', ['active', 'returned', 'overdue'])->default('active');
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('book_id')->references('id')->on('books')->cascadeOnDelete();
            $table->index('status');
            $table->index('due_date');
        });

        // 4. Reservations Table
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->string('reservation_id', 50)->unique();
            $table->string('user_id', 64);
            $table->string('book_id', 64);
            $table->date('reservation_date');
            $table->date('expiration_date')->nullable();
            $table->enum('status', ['pending', 'ready', 'fulfilled', 'cancelled', 'expired'])->default('pending');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('book_id')->references('id')->on('books')->cascadeOnDelete();
            $table->index('status');
        });

        // 5. Fines Table
        Schema::create('fines', function (Blueprint $table) {
            $table->id();
            $table->string('user_id', 64);
            $table->unsignedBigInteger('transaction_id')->nullable();
            $table->decimal('amount', 8, 2);
            $table->string('reason', 255);
            $table->enum('status', ['unpaid', 'paid', 'waived'])->default('unpaid');
            $table->dateTime('paid_at')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('transaction_id')->references('id')->on('transactions')->nullOnDelete();
            $table->index('status');
        });

        // 6. Requests Table
        Schema::create('requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_id', 50)->unique();
            $table->enum('type', ['borrowing', 'archive', 'acquisition']);
            $table->string('user_id', 64);
            $table->string('book_id', 64)->nullable();
            $table->string('title', 255)->nullable();
            $table->string('author', 150)->nullable();
            $table->text('reason')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'completed'])->default('pending');
            $table->string('approver_id', 64)->nullable();
            $table->dateTime('approval_date')->nullable();
            $table->text('remarks')->nullable();
            $table->string('school_id_image', 255)->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('book_id')->references('id')->on('books')->nullOnDelete();
            $table->foreign('approver_id')->references('id')->on('users')->nullOnDelete();
            $table->index(['type', 'status']);
        });

        // 7. Favorites Table
        Schema::create('favorites', function (Blueprint $table) {
            $table->id();
            $table->string('user_id', 64);
            $table->string('book_id', 64);
            $table->timestamps();

            $table->unique(['user_id', 'book_id']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('book_id')->references('id')->on('books')->cascadeOnDelete();
        });

        // 8. Saved Searches Table
        Schema::create('saved_searches', function (Blueprint $table) {
            $table->id();
            $table->string('user_id', 64);
            $table->string('search_name', 100);
            $table->text('filters_json');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        // 9. Announcements Table
        Schema::create('announcements', function (Blueprint $table) {
            $table->string('id', 50)->primary();
            $table->string('title', 200);
            $table->text('content');
            $table->string('category', 100)->default('General');
            $table->string('author_id', 64);
            $table->string('author_name', 150)->nullable();
            $table->dateTime('published_at');
            $table->dateTime('expires_at')->nullable();
            $table->enum('status', ['active', 'archived', 'deleted'])->default('active');
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('author_id')->references('id')->on('users')->cascadeOnDelete();
        });

        // 10. Attendance Table
        Schema::create('attendance', function (Blueprint $table) {
            $table->id();
            $table->string('user_id', 64);
            $table->string('full_name', 150);
            $table->string('role', 50)->default('member');
            $table->string('purpose', 100)->default('General Reading');
            $table->timestamp('time_in')->useCurrent();
            $table->timestamp('time_out')->nullable();
            $table->date('date')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index('date');
        });

        // 11. System Settings Table
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('setting_key', 100)->unique();
            $table->text('setting_value');
            $table->string('description', 255)->nullable();
            $table->timestamps();
        });

        // 12. Backups Table
        Schema::create('backups', function (Blueprint $table) {
            $table->id();
            $table->string('backup_name', 150);
            $table->string('file_path', 255);
            $table->integer('file_size_kb')->default(0);
            $table->string('created_by', 64);
            $table->enum('status', ['completed', 'failed'])->default('completed');
            $table->timestamps();

            $table->foreign('created_by')->references('id')->on('users')->cascadeOnDelete();
        });

        // 13. System Logs Table
        Schema::create('system_logs', function (Blueprint $table) {
            $table->id();
            $table->string('log_type', 50);
            $table->enum('severity', ['info', 'warning', 'critical'])->default('info');
            $table->text('message');
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->index('log_type');
            $table->index('severity');
        });

        // 14. Activity Logs Table
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->string('user_id', 64)->nullable();
            $table->string('action', 50);
            $table->string('module', 50);
            $table->text('description');
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->index('module');
            $table->index('user_id');
        });

        // 15. Notifications Table
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('user_id', 64);
            $table->string('title', 150);
            $table->text('message');
            $table->enum('type', ['overdue', 'due_soon', 'reservation', 'fine', 'announcement'])->default('announcement');
            $table->boolean('is_read')->default(false);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index(['user_id', 'is_read']);
        });

        // 16. Digital Resources Table
        Schema::create('digital_resources', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255);
            $table->string('author', 150);
            $table->string('category', 100);
            $table->text('description')->nullable();
            $table->string('file_url', 255);
            $table->string('file_type', 20)->default('PDF');
            $table->decimal('file_size_mb', 5, 2)->default(0.00);
            $table->timestamps();

            $table->index('category');
        });

        // 17. Digital Reading History Table
        Schema::create('digital_reading_history', function (Blueprint $table) {
            $table->id();
            $table->string('user_id', 64);
            $table->unsignedBigInteger('resource_id');
            $table->integer('read_duration_seconds')->default(0);
            $table->timestamp('last_accessed')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('resource_id')->references('digital_resources')->on('id')->cascadeOnDelete();
        });

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('digital_reading_history');
        Schema::dropIfExists('digital_resources');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('system_logs');
        Schema::dropIfExists('backups');
        Schema::dropIfExists('system_settings');
        Schema::dropIfExists('attendance');
        Schema::dropIfExists('announcements');
        Schema::dropIfExists('saved_searches');
        Schema::dropIfExists('favorites');
        Schema::dropIfExists('requests');
        Schema::dropIfExists('fines');
        Schema::dropIfExists('reservations');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('books');
        Schema::dropIfExists('users');
        Schema::enableForeignKeyConstraints();
    }
};

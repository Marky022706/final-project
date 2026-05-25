<?php
// backend/database/seed.php
require_once __DIR__ . '/../config/constants.php';

try {
    // 1. Initial Connection without database selected
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ];
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    
    echo "Connecting to MySQL server...\n";

    // 2. Read and run schema.sql
    $schemaFile = __DIR__ . '/schema.sql';
    if (!file_exists($schemaFile)) {
        throw new Exception("schema.sql not found at " . $schemaFile);
    }
    
    echo "Running schema.sql...\n";
    $sql = file_get_contents($schemaFile);
    
    // Execute schema queries
    $pdo->exec($sql);
    echo "Database and tables successfully created!\n";
    
    // Select database
    $pdo->exec("USE " . DB_NAME);

    // 3. Seed Users
    echo "Seeding users...\n";
    $users = [
        [
            'first_name' => 'Balingasag Library',
            'middle_name' => 'Municipal',
            'last_name' => 'Admin',
            'email' => 'admin@balingasag.gov.ph',
            'password' => 'admin123',
            'role' => 'admin',
            'phone' => '09171234567',
            'address' => 'Municipal Hall, Balingasag, Misamis Oriental',
            'status' => 'active'
        ],
        [
            'first_name' => 'Juan',
            'middle_name' => 'Ponce',
            'last_name' => 'Dela Cruz',
            'email' => 'member@balingasag.gov.ph',
            'password' => 'member123',
            'role' => 'member',
            'phone' => '09187654321',
            'address' => 'Barangay 15, Balingasag, Misamis Oriental',
            'status' => 'active'
        ],
        [
            'first_name' => 'Maria',
            'middle_name' => 'Clara',
            'last_name' => 'Santos',
            'email' => 'maria@gmail.com',
            'password' => 'member123',
            'role' => 'member',
            'phone' => '09223344556',
            'address' => 'Barangay Waterfall, Balingasag, Misamis Oriental',
            'status' => 'active'
        ]
    ];

    $stmtUser = $pdo->prepare("INSERT INTO users (first_name, middle_name, last_name, email, password_hash, role, phone, address, status, member_since) 
        VALUES (:first_name, :middle_name, :last_name, :email, :password_hash, :role, :phone, :address, :status, :member_since)");

    $memberSince = date('Y-m-d', strtotime('-3 months'));

    foreach ($users as $u) {
        $stmtUser->execute([
            ':first_name' => $u['first_name'],
            ':middle_name' => $u['middle_name'],
            ':last_name' => $u['last_name'],
            ':email' => $u['email'],
            ':password_hash' => password_hash($u['password'], PASSWORD_DEFAULT),
            ':role' => $u['role'],
            ':phone' => $u['phone'],
            ':address' => $u['address'],
            ':status' => $u['status'],
            ':member_since' => $memberSince
        ]);
    }
    
    // Get seeded IDs
    $adminId = 1;
    $juanId = 2;
    $mariaId = 3;

    // 4. Seed Books
    echo "Seeding books...\n";
    $books = [];

    $stmtBook = $pdo->prepare("INSERT INTO books (title, author, isbn, category, year, description, cover_image, total_copies, available_copies, status) 
        VALUES (:title, :author, :isbn, :category, :year, :description, :cover_image, :total_copies, :available_copies, :status)");

    foreach ($books as $b) {
        $stmtBook->execute([
            ':title' => $b['title'],
            ':author' => $b['author'],
            ':isbn' => $b['isbn'],
            ':category' => $b['category'],
            ':year' => $b['year'],
            ':description' => $b['description'],
            ':cover_image' => $b['cover_image'],
            ':total_copies' => $b['total_copies'],
            ':available_copies' => $b['available_copies'],
            ':status' => $b['status']
        ]);
    }

    // 5. Seed Transactions (Loans)
    echo "Seeding transactions...\n";
    $transactions = [];

    $stmtTxn = $pdo->prepare("INSERT INTO transactions (transaction_id, user_id, book_id, borrow_date, due_date, return_date, renewals, status) 
        VALUES (:transaction_id, :user_id, :book_id, :borrow_date, :due_date, :return_date, :renewals, :status)");

    foreach ($transactions as $t) {
        $stmtTxn->execute([
            ':transaction_id' => $t['transaction_id'],
            ':user_id' => $t['user_id'],
            ':book_id' => $t['book_id'],
            ':borrow_date' => $t['borrow_date'],
            ':due_date' => $t['due_date'],
            ':return_date' => $t['return_date'],
            ':renewals' => $t['renewals'],
            ':status' => $t['status']
        ]);
    }

    // 6. Seed Fines
    echo "Seeding fines...\n";
    $fines = [];

    $stmtFine = $pdo->prepare("INSERT INTO fines (fine_id, user_id, transaction_id, amount, reason, status, paid_date) 
        VALUES (:fine_id, :user_id, :transaction_id, :amount, :reason, :status, :paid_date)");

    foreach ($fines as $f) {
        $stmtFine->execute([
            ':fine_id' => $f['fine_id'],
            ':user_id' => $f['user_id'],
            ':transaction_id' => $f['transaction_id'],
            ':amount' => $f['amount'],
            ':reason' => $f['reason'],
            ':status' => $f['status'],
            ':paid_date' => $f['paid_date']
        ]);
    }

    // 7. Seed Notifications
    echo "Seeding notifications...\n";
    $notifications = [
        [
            'user_id' => $juanId,
            'title' => 'Welcome to Balingasag Public Library',
            'message' => 'Welcome! Your library card account is activated. Search the catalog and enjoy borrowing.',
            'type' => 'announcement',
            'is_read' => false
        ],
        [
            'user_id' => $mariaId,
            'title' => 'Welcome to Balingasag Public Library',
            'message' => 'Welcome! Your library card account is activated. Search the catalog and enjoy borrowing.',
            'type' => 'announcement',
            'is_read' => true
        ]
    ];

    $stmtNotif = $pdo->prepare("INSERT INTO notifications (user_id, title, message, type, is_read) 
        VALUES (:user_id, :title, :message, :type, :is_read)");

    foreach ($notifications as $n) {
        $stmtNotif->execute([
            ':user_id' => $n['user_id'],
            ':title' => $n['title'],
            ':message' => $n['message'],
            ':type' => $n['type'],
            ':is_read' => $n['is_read'] ? 1 : 0
        ]);
    }

    echo "\nDatabase seeding completed successfully! Test accounts available:\n";
    echo "Admin: admin@balingasag.gov.ph / admin123\n";
    echo "Member: member@balingasag.gov.ph / member123\n";
    echo "Member: maria@gmail.com / member123\n\n";

} catch (Exception $e) {
    echo "Error while seeding: " . $e->getMessage() . "\n";
    exit(1);
}
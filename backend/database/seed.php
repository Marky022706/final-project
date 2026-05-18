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
            'last_name' => 'Clara',
            'email' => 'maria@gmail.com',
            'password' => 'member123',
            'role' => 'member',
            'phone' => '09223344556',
            'address' => 'Barangay Waterfall, Balingasag, Misamis Oriental',
            'status' => 'active'
        ]
    ];

    $stmtUser = $pdo->prepare("INSERT INTO users (first_name, last_name, email, password_hash, role, phone, address, status, member_since) 
        VALUES (:first_name, :last_name, :email, :password_hash, :role, :phone, :address, :status, :member_since)");

    $memberSince = date('Y-m-d', strtotime('-3 months'));

    foreach ($users as $u) {
        $stmtUser->execute([
            ':first_name' => $u['first_name'],
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
    $books = [
        [
            'title' => 'Clean Code',
            'author' => 'Robert C. Martin',
            'isbn' => '9780132350884',
            'category' => 'Technology',
            'year' => 2008,
            'description' => 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees. Every year, countless hours and significant resources are lost because of poorly written code. But it doesn\'t have to be that way.',
            'cover_image' => 'https://images-na.ssl-images-amazon.com/images/I/41xSh4s1LmL._SX327_BO1,204,203,200_.jpg',
            'total_copies' => 5,
            'available_copies' => 3,
            'status' => 'available'
        ],
        [
            'title' => 'Sapiens: A Brief History of Humankind',
            'author' => 'Yuval Noah Harari',
            'isbn' => '9780062316097',
            'category' => 'History',
            'year' => 2011,
            'description' => '100,000 years ago, at least six human species inhabited the earth. Today there is only one. Us. Homo sapiens. How did our species succeed in the battle for dominance? How did our foraging ancestors come together to create cities and kingdoms?',
            'cover_image' => 'https://images-na.ssl-images-amazon.com/images/I/41yu2qXhXXL._SX324_BO1,204,203,200_.jpg',
            'total_copies' => 4,
            'available_copies' => 3,
            'status' => 'available'
        ],
        [
            'title' => 'A Brief History of Time',
            'author' => 'Stephen Hawking',
            'isbn' => '9780553380163',
            'category' => 'Science',
            'year' => 1988,
            'description' => 'A landmark volume in science writing by one of the great minds of our time, Stephen Hawking\'s book explores the most complex theories of cosmology, from the Big Bang to black holes, in accessible language for general readers.',
            'cover_image' => 'https://images-na.ssl-images-amazon.com/images/I/51+GyD2aI5L._SX331_BO1,204,203,200_.jpg',
            'total_copies' => 3,
            'available_copies' => 2,
            'status' => 'available'
        ],
        [
            'title' => 'The Design of Everyday Things',
            'author' => 'Don Norman',
            'isbn' => '9780465050659',
            'category' => 'Design',
            'year' => 1988,
            'description' => 'Even the smartest among us can feel inept as we try to figure out which joint to pull or push on a door, or whether to turn, push or pull a faucet. The Design of Everyday Things shows that usable, satisfying design is possible with a few rules.',
            'cover_image' => 'https://images-na.ssl-images-amazon.com/images/I/51Dl39IG8mL._SX322_BO1,204,203,200_.jpg',
            'total_copies' => 3,
            'available_copies' => 3,
            'status' => 'available'
        ],
        [
            'title' => 'Steve Jobs',
            'author' => 'Walter Isaacson',
            'isbn' => '9781451648539',
            'category' => 'Biography',
            'year' => 2011,
            'description' => 'Based on more than forty interviews with Steve Jobs conducted over two years, Walter Isaacson has written a riveting story of the roller-coaster life and searingly intense personality of a creative entrepreneur whose passion revolutionized six industries.',
            'cover_image' => 'https://images-na.ssl-images-amazon.com/images/I/41dK7eB7dSL._SX326_BO1,204,203,200_.jpg',
            'total_copies' => 2,
            'available_copies' => 1,
            'status' => 'available'
        ],
        [
            'title' => 'Calculus Made Easy',
            'author' => 'Silvanus P. Thompson',
            'isbn' => '9780312185480',
            'category' => 'Mathematics',
            'year' => 1910,
            'description' => 'Calculus Made Easy has long been the most popular calculus primer, and this major revision of the classic math text introduces the beautiful complexities of derivatives and integrals to general students in an intuitive, non-threatening manner.',
            'cover_image' => 'https://images-na.ssl-images-amazon.com/images/I/51nZea0W2eL._SX331_BO1,204,203,200_.jpg',
            'total_copies' => 3,
            'available_copies' => 3,
            'status' => 'available'
        ],
        [
            'title' => 'To Kill a Mockingbird',
            'author' => 'Harper Lee',
            'isbn' => '9780061120084',
            'category' => 'Fiction',
            'year' => 1960,
            'description' => 'Compassionate, dramatic, and deeply moving, To Kill a Mockingbird takes readers to the roots of human behavior - to innocence and experience, kindness and cruelty, love and hatred, humor and pathos. This classic has sold over 40 million copies.',
            'cover_image' => 'https://images-na.ssl-images-amazon.com/images/I/71FxgtfkcQL.jpg',
            'total_copies' => 4,
            'available_copies' => 4,
            'status' => 'available'
        ],
        [
            'title' => 'The Pragmatic Programmer',
            'author' => 'David Thomas & Andrew Hunt',
            'isbn' => '9780135957059',
            'category' => 'Technology',
            'year' => 2019,
            'description' => 'The Pragmatic Programmer is one of those rare tech books you will read, re-read, and read again over the years. Whether you’re new to the field or an experienced practitioner, you’ll come away with fresh insights on a regular basis.',
            'cover_image' => 'https://images-na.ssl-images-amazon.com/images/I/51IA4hT62KL._SX396_BO1,204,203,200_.jpg',
            'total_copies' => 2,
            'available_copies' => 2,
            'status' => 'available'
        ]
    ];

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
    $transactions = [
        [
            'transaction_id' => 'TXN-2026-0001',
            'user_id' => $juanId, // Juan
            'book_id' => 1,       // Clean Code (available_copies was decremented)
            'borrow_date' => date('Y-m-d', strtotime('-25 days')),
            'due_date' => date('Y-m-d', strtotime('-11 days')), // Overdue by 11 days
            'return_date' => null,
            'renewals' => 0,
            'status' => 'overdue'
        ],
        [
            'transaction_id' => 'TXN-2026-0002',
            'user_id' => $juanId, // Juan
            'book_id' => 2,       // Sapiens
            'borrow_date' => date('Y-m-d', strtotime('-10 days')),
            'due_date' => date('Y-m-d', strtotime('+4 days')),  // Active
            'return_date' => null,
            'renewals' => 0,
            'status' => 'active'
        ],
        [
            'transaction_id' => 'TXN-2026-0003',
            'user_id' => $mariaId, // Maria
            'book_id' => 3,       // A Brief History of Time
            'borrow_date' => date('Y-m-d', strtotime('-30 days')),
            'due_date' => date('Y-m-d', strtotime('-16 days')),
            'return_date' => date('Y-m-d', strtotime('-16 days')), // Completed on time
            'renewals' => 1,
            'status' => 'completed'
        ],
        [
            'transaction_id' => 'TXN-2026-0004',
            'user_id' => $mariaId, // Maria
            'book_id' => 5,       // Steve Jobs
            'borrow_date' => date('Y-m-d', strtotime('-5 days')),
            'due_date' => date('Y-m-d', strtotime('+9 days')), // Active
            'return_date' => null,
            'renewals' => 0,
            'status' => 'active'
        ]
    ];

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
    $fines = [
        [
            'fine_id' => 'FIN-2026-0001',
            'user_id' => $juanId, // Juan
            'transaction_id' => 1, // Clean Code (Transaction #1, overdue by 11 days)
            'amount' => 55.00,    // 11 days * ₱5.00/day
            'reason' => 'Clean Code book returned late/still overdue by 11 days.',
            'status' => 'unpaid',
            'paid_date' => null
        ],
        [
            'fine_id' => 'FIN-2026-0002',
            'user_id' => $mariaId, // Maria
            'transaction_id' => 3, // Overdue by 4 days in the past and then settled
            'amount' => 20.00,    // 4 days * ₱5.00
            'reason' => 'A Brief History of Time returned 4 days overdue.',
            'status' => 'paid',
            'paid_date' => date('Y-m-d', strtotime('-16 days'))
        ]
    ];

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
            'title' => 'Book Overdue Warning!',
            'message' => 'Your borrowed book "Clean Code" was due on ' . date('F j, Y', strtotime('-11 days')) . '. Please return it to avoid further fines.',
            'type' => 'overdue',
            'is_read' => false
        ],
        [
            'user_id' => $juanId,
            'title' => 'Upcoming Due Date',
            'message' => 'Your borrowed book "Sapiens" is due on ' . date('F j, Y', strtotime('+4 days')) . '. Please return or renew it in time.',
            'type' => 'due_reminder',
            'is_read' => true
        ],
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

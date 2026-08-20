<?php
// backend/api/books/create.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/activity_logger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed. Only POST is supported.', 405);
}

// Admin / Super Admin Route Guard
$currentUser = JWT::requireRole(['admin', 'superadmin']);

$input = Utils::getJsonInput();

$required = ['title', 'author', 'category', 'publisher', 'year', 'isbn', 'shelf_location'];
$missing = Utils::checkRequired($required, $input);

if (!empty($missing)) {
    Response::badRequest('Missing required fields: ' . implode(', ', $missing));
}

$title = trim($input['title']);
$author = trim($input['author']);
$publisher = trim($input['publisher'] ?? '');
$isbn = trim($input['isbn']);
$category = trim($input['category']);
$year = (int)$input['year'];
$shelfLocation = trim($input['shelf_location'] ?? 'Main Shelf');
$format = trim($input['format'] ?? 'Paperback');
$condition = $input['book_condition'] ?? 'good';
$description = !empty($input['description']) ? trim($input['description']) : null;
$coverImage = !empty($input['cover_image']) ? trim($input['cover_image']) : null;
$totalCopies = isset($input['total_copies']) ? (int)$input['total_copies'] : 1;
$accessionNumber = trim($input['accession_number'] ?? '');
$statusInput = $input['status'] ?? 'available';

if ($totalCopies < 0) {
    Response::badRequest('Total copies cannot be negative.');
}

try {
    $db = Database::getConnection();
    
    // Check if ISBN already exists
    $stmtCheck = $db->prepare("SELECT id FROM books WHERE isbn = :isbn AND deleted_at IS NULL");
    $stmtCheck->execute([':isbn' => $isbn]);
    if ($stmtCheck->fetch()) {
        Response::badRequest('A book with this ISBN already exists.');
    }

    // Auto-generate accession number if empty
    if (empty($accessionNumber)) {
        $accessionNumber = 'ACC-' . date('Y') . '-' . strtoupper(substr(uniqid(), -5));
    } else {
        // Check uniqueness of accession number
        $stmtAcc = $db->prepare("SELECT id FROM books WHERE accession_number = :acc AND deleted_at IS NULL");
        $stmtAcc->execute([':acc' => $accessionNumber]);
        if ($stmtAcc->fetch()) {
            Response::badRequest('Accession number is already in use by another book.');
        }
    }

    $qrCode = 'BOOK-QR-' . strtoupper(bin2hex(random_bytes(6)));
    $status = $totalCopies <= 0 ? 'unavailable' : ($statusInput ?: 'available');

    $stmtId = $db->query("SHOW COLUMNS FROM books WHERE Field = 'id'");
    $idCol = $stmtId->fetch(PDO::FETCH_ASSOC);
    $hasAutoInc = strpos($idCol['Extra'] ?? '', 'auto_increment') !== false;

    $fields = ['accession_number', 'title', 'author', 'publisher', 'isbn', 'category', 'year', 'shelf_location', 'format', 'book_condition', 'description', 'cover_image', 'total_copies', 'available_copies', 'qr_code', 'status'];
    $placeholders = [':accession_number', ':title', ':author', ':publisher', ':isbn', ':category', ':year', ':shelf_location', ':format', ':condition', ':description', ':cover_image', ':total_copies', ':available_copies', ':qr_code', ':status'];
    
    $params = [
        ':accession_number' => $accessionNumber,
        ':title' => $title,
        ':author' => $author,
        ':publisher' => $publisher ?: 'Standard Publication',
        ':isbn' => $isbn,
        ':category' => $category,
        ':year' => $year,
        ':shelf_location' => $shelfLocation ?: 'Main Shelf',
        ':format' => $format,
        ':condition' => $condition,
        ':description' => $description,
        ':cover_image' => $coverImage,
        ':total_copies' => $totalCopies,
        ':available_copies' => $totalCopies,
        ':qr_code' => $qrCode,
        ':status' => $status
    ];

    if (!$hasAutoInc) {
        $fields[] = 'id';
        $placeholders[] = ':id';
        $params[':id'] = 'BK-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -5));
    }

    $sql = "INSERT INTO books (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $placeholders) . ")";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    $bookId = $hasAutoInc ? $db->lastInsertId() : $params[':id'];
    
    logActivity(
        $currentUser['id'],
        'create_book',
        'Books',
        "Added new book: '{$title}' (Accession: {$accessionNumber}, ISBN: {$isbn})"
    );
    
    Response::created([
        'id' => $bookId,
        'accession_number' => $accessionNumber,
        'qr_code' => $qrCode,
        'title' => $title
    ], 'Book added to catalog successfully with auto-generated QR code!');

} catch (PDOException $e) {
    Response::error('Server database error: ' . $e->getMessage());
}

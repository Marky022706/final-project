<?php
// backend/api/books/create.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/middleware.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed. Only POST is supported.', 405);
}

// Admin Route Guard
Middleware::requireAdmin();

$input = Utils::getJsonInput();

$required = ['title', 'author', 'isbn', 'category', 'year'];
$missing = Utils::checkRequired($required, $input);

if (!empty($missing)) {
    Response::badRequest('Missing required fields: ' . implode(', ', $missing));
}

$title = $input['title'];
$author = $input['author'];
$isbn = $input['isbn'];
$category = $input['category'];
$year = (int)$input['year'];
$description = $input['description'] ?? null;
$coverImage = $input['cover_image'] ?? null;
$totalCopies = isset($input['total_copies']) ? (int)$input['total_copies'] : 1;

if ($totalCopies < 0) {
    Response::badRequest('Total copies cannot be negative.');
}

try {
    $db = Database::getConnection();
    
    // Check if ISBN already exists
    $stmtCheck = $db->prepare("SELECT id FROM books WHERE isbn = :isbn");
    $stmtCheck->execute([':isbn' => $isbn]);
    if ($stmtCheck->fetch()) {
        Response::badRequest('A book with this ISBN already exists.');
    }
    
    $status = $totalCopies > 0 ? 'available' : 'unavailable';
    
    $stmt = $db->prepare("
        INSERT INTO books (title, author, isbn, category, year, description, cover_image, total_copies, available_copies, status)
        VALUES (:title, :author, :isbn, :category, :year, :description, :cover_image, :total_copies, :available_copies, :status)
    ");
    
    $stmt->execute([
        ':title' => $title,
        ':author' => $author,
        ':isbn' => $isbn,
        ':category' => $category,
        ':year' => $year,
        ':description' => $description,
        ':cover_image' => $coverImage,
        ':total_copies' => $totalCopies,
        ':available_copies' => $totalCopies,
        ':status' => $status
    ]);
    
    $newId = (int)$db->lastInsertId();
    
    Response::created(['id' => $newId], 'Book created and added to catalog successfully!');

} catch (PDOException $e) {
    Response::error('Server database error: ' . $e->getMessage());
}

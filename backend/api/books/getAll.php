<?php
// backend/api/books/getAll.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed. Only GET is supported.', 405);
}

// Extract query parameters
$search = $_GET['search'] ?? '';
$category = $_GET['category'] ?? '';
$availability = $_GET['availability'] ?? 'all'; // 'all' or 'available'
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 8;

if ($page < 1) $page = 1;
if ($limit < 1) $limit = 8;
$offset = ($page - 1) * $limit;

try {
    $db = Database::getConnection();
    
    // Construct Query
    $whereClauses = [];
    $params = [];

    // By default, exclude archived books unless explicitly requested
    $includeArchived = isset($_GET['include_archived']) && $_GET['include_archived'] === 'true';
    if (!$includeArchived) {
        $whereClauses[] = "status != 'archived'";
    }
    
    if (!empty($search)) {
        $whereClauses[] = "(title LIKE :search_title OR author LIKE :search_author OR isbn LIKE :search_isbn)";
        $searchVal = '%' . $search . '%';
        $params[':search_title'] = $searchVal;
        $params[':search_author'] = $searchVal;
        $params[':search_isbn'] = $searchVal;
    }
    
    if (!empty($category)) {
        $whereClauses[] = "category = :category";
        $params[':category'] = $category;
    }
    
    if ($availability === 'available') {
        $whereClauses[] = "available_copies > 0 AND status = 'available'";
    }
    
    $whereSql = '';
    if (!empty($whereClauses)) {
        $whereSql = ' WHERE ' . implode(' AND ', $whereClauses);
    }
    
    // 1. Get Total Count
    $countSql = "SELECT COUNT(*) FROM books" . $whereSql;
    $stmtCount = $db->prepare($countSql);
    $stmtCount->execute($params);
    $totalBooks = (int)$stmtCount->fetchColumn();
    $totalPages = ceil($totalBooks / $limit);
    
    // 2. Fetch Paginated Records
    $fetchSql = "SELECT * FROM books" . $whereSql . " ORDER BY title ASC LIMIT :limit OFFSET :offset";
    $stmtFetch = $db->prepare($fetchSql);
    
    // Bind parameters
    foreach ($params as $key => $val) {
        $stmtFetch->bindValue($key, $val);
    }
    $stmtFetch->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmtFetch->bindValue(':offset', $offset, PDO::PARAM_INT);
    
    $stmtFetch->execute();
    $books = $stmtFetch->fetchAll();
    
    Response::success([
        'books' => $books,
        'pagination' => [
            'total' => $totalBooks,
            'page' => $page,
            'limit' => $limit,
            'totalPages' => $totalPages
        ]
    ], 'Books fetched successfully.');

} catch (PDOException $e) {
    Response::error('Server database error: ' . $e->getMessage());
}

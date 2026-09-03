<?php
// backend/api/books/getAll.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed. Only GET is supported.', 405);
}

// Extract query parameters
$search = trim($_GET['search'] ?? '');
$category = trim($_GET['category'] ?? '');
$condition = trim($_GET['condition'] ?? '');
$format = trim($_GET['format'] ?? '');
$availability = trim($_GET['availability'] ?? 'all'); // 'all', 'available', 'unavailable'
$status = trim($_GET['status'] ?? '');
$page = max(1, (int)($_GET['page'] ?? 1));
$limit = min(100, max(1, (int)($_GET['limit'] ?? 12)));
$offset = ($page - 1) * $limit;

try {
    $db = Database::getConnection();
    
    $whereClauses = ["deleted_at IS NULL"];
    $params = [];

    // By default, exclude archived books unless explicitly requested
    $includeArchived = isset($_GET['include_archived']) && $_GET['include_archived'] === 'true';
    if ($status === 'archived') {
        $whereClauses[] = "status = 'archived'";
    } elseif (!$includeArchived) {
        $whereClauses[] = "status != 'archived'";
    }
    
    if (!empty($search)) {
        $whereClauses[] = "(title LIKE :search OR author LIKE :search OR publisher LIKE :search OR isbn LIKE :search OR accession_number LIKE :search OR shelf_location LIKE :search)";
        $params[':search'] = "%$search%";
    }
    
    if (!empty($category) && $category !== 'All') {
        $whereClauses[] = "category = :category";
        $params[':category'] = $category;
    }

    if (!empty($condition) && $condition !== 'All') {
        $whereClauses[] = "book_condition = :condition";
        $params[':condition'] = $condition;
    }

    if (!empty($format) && $format !== 'All') {
        $whereClauses[] = "format = :format";
        $params[':format'] = $format;
    }
    
    if ($availability === 'available') {
        $whereClauses[] = "available_copies > 0 AND status = 'available'";
    } elseif ($availability === 'unavailable') {
        $whereClauses[] = "(available_copies <= 0 OR status = 'unavailable')";
    }
    
    $whereSql = ' WHERE ' . implode(' AND ', $whereClauses);
    
    // 1. Get Total Count
    $countSql = "SELECT COUNT(*) FROM books" . $whereSql;
    $stmtCount = $db->prepare($countSql);
    $stmtCount->execute($params);
    $totalBooks = (int)$stmtCount->fetchColumn();
    $totalPages = ceil($totalBooks / $limit);
    
    // 2. Fetch Paginated Records
    $fetchSql = "SELECT * FROM books" . $whereSql . " ORDER BY created_at DESC, title ASC LIMIT :limit OFFSET :offset";
    $stmtFetch = $db->prepare($fetchSql);
    
    foreach ($params as $key => $val) {
        $stmtFetch->bindValue($key, $val);
    }
    $stmtFetch->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmtFetch->bindValue(':offset', $offset, PDO::PARAM_INT);
    
    $stmtFetch->execute();
    $books = $stmtFetch->fetchAll(PDO::FETCH_ASSOC);

    // Fetch categories list for filters
    $categories = $db->query("SELECT DISTINCT category FROM books WHERE deleted_at IS NULL AND category IS NOT NULL AND category != '' ORDER BY category ASC")->fetchAll(PDO::FETCH_COLUMN);
    
    Response::success([
        'books' => $books,
        'categories' => $categories,
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

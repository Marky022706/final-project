<?php
// backend/api/ai/isbn-lookup.php
// Quick Accession / ISBN Lookup & Autofill API via Local AI (Qwen LLM @ http://127.0.0.1:1234) & Library Database

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/middleware.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/LocalAiService.php';

// Authenticate user (Admin, Superadmin, or Staff)
$currentUser = Middleware::requireAuth();

$input = Utils::getJsonInput();
$query = trim($input['query'] ?? ($input['isbn'] ?? ($input['accession_number'] ?? ($_GET['query'] ?? ($_GET['isbn'] ?? '')))));

if (empty($query)) {
    Response::badRequest('Accession number, ISBN, or book identifier is required.');
}

$cleanIsbn = preg_replace('/[-\s]/', '', $query);

try {
    $db = Database::getConnection();

    // 1. Check if the book already exists in local database by Accession Number or ISBN
    $stmtDb = $db->prepare("
        SELECT * FROM books 
        WHERE (accession_number = :q1 OR isbn = :q2 OR isbn = :q3 OR id = :q4 OR qr_code = :q5)
          AND deleted_at IS NULL
        LIMIT 1
    ");
    $stmtDb->execute([
        ':q1' => $query,
        ':q2' => $query,
        ':q3' => $cleanIsbn,
        ':q4' => $query,
        ':q5' => $query
    ]);
    $existing = $stmtDb->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        Response::success([
            'title' => $existing['title'],
            'author' => $existing['author'],
            'publisher' => $existing['publisher'] ?: 'Standard Publication',
            'category' => $existing['category'],
            'year' => (int)$existing['year'],
            'accession_number' => $existing['accession_number'],
            'isbn' => $existing['isbn'],
            'shelf_location' => $existing['shelf_location'] ?: 'Main Shelf',
            'format' => $existing['format'] ?: 'Paperback',
            'total_copies' => (int)$existing['total_copies'],
            'status' => $existing['status'] ?: 'available',
            'description' => $existing['description'] ?: '',
            'cover_image' => $existing['cover_image'] ?: '',
            'source' => 'database'
        ], "Found existing catalog record for \"{$existing['title']}\" in library database.");
    }

    // 2. Query Local AI Model (qwen/qwen3-1.7b)
    $localAi = new LocalAiService();
    $bookData = null;

    if ($localAi->isAvailable()) {
        $bookData = $localAi->lookupBook($query);
        if ($bookData && !empty($bookData['title'])) {
            $bookData['source'] = 'local-ai';
        }
    }

    // 3. Fallback to Open Library / Google Books if not found via Local AI
    if (!$bookData || empty($bookData['title'])) {
        $olUrl = "https://openlibrary.org/api/books?bibkeys=ISBN:" . urlencode($cleanIsbn) . "&jscmd=data&format=json";
        $ch = curl_init($olUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 6);
        $olRes = curl_exec($ch);
        $olCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if ($olCode === 200 && !empty($olRes)) {
            $data = json_decode($olRes, true);
            $key = "ISBN:" . $cleanIsbn;
            if (isset($data[$key])) {
                $item = $data[$key];
                $authors = !empty($item['authors']) ? array_column($item['authors'], 'name') : [];
                $publishers = !empty($item['publishers']) ? array_column($item['publishers'], 'name') : [];
                $subjects = !empty($item['subjects']) ? array_column($item['subjects'], 'name') : [];
                
                $year = date('Y');
                if (!empty($item['publish_date']) && preg_match('/\b(19\d\d|20\d\d)\b/', $item['publish_date'], $ym)) {
                    $year = (int)$ym[1];
                }

                $bookData = [
                    'title' => $item['title'] ?? '',
                    'author' => implode(', ', $authors),
                    'publisher' => implode(', ', $publishers) ?: 'Standard Publication',
                    'category' => !empty($subjects[0]) ? $subjects[0] : 'Fiction',
                    'year' => $year,
                    'isbn' => $cleanIsbn,
                    'format' => 'Paperback',
                    'shelf_location' => 'Main Shelf',
                    'cover_image' => $item['cover']['large'] ?? ($item['cover']['medium'] ?? ''),
                    'description' => is_string($item['description'] ?? null) ? $item['description'] : ($item['description']['value'] ?? ''),
                    'source' => 'openlibrary'
                ];
            }
        }
    }

    if (!$bookData || empty($bookData['title'])) {
        Response::notFound("No catalog or AI metadata records found for identifier: {$query}");
    }

    // Keep provided accession number if user searched with ACC- prefix
    if (strpos(strtoupper($query), 'ACC') !== false) {
        $bookData['accession_number'] = $query;
    }

    Response::success($bookData, 'Book details retrieved successfully via AI & catalog services.');

} catch (Exception $e) {
    Response::error('Failed to query lookup service: ' . $e->getMessage());
}

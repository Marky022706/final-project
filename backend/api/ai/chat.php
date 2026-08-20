<?php
// backend/api/ai/chat.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/middleware.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/ai_functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed. Only POST is supported.', 405);
}

// Authenticate user
$currentUser = Middleware::requireAuth();

$input = Utils::getJsonInput();
$message = $input['message'] ?? '';
$conversationHistory = $input['conversation_history'] ?? [];

if (empty($message)) {
    Response::badRequest('Message is required.');
}

try {
    $db = Database::getConnection();
    
    // Analyze user intent and gather relevant data
    $intent = analyzeIntent($message);
    $contextData = [];
    
    switch ($intent) {
        case 'book_search':
            $searchTerms = extractSearchTerms($message);
            $contextData['books'] = searchBooks($db, $searchTerms);
            break;
        case 'user_books':
            $contextData['user_books'] = getUserBooks($db, $currentUser['id']);
            $contextData['user_fines'] = getUserFines($db, $currentUser['id']);
            break;
        case 'library_rules':
            $contextData['rules'] = getLibraryRules();
            break;
        case 'recommendations':
            $contextData['recommendations'] = getBookRecommendations($db, $message);
            break;
        default:
            // General query - gather basic context
            $contextData['user_name'] = $currentUser['first_name'];
            break;
    }
    
    // Generate AI response
    $aiResponse = generateAIResponse($message, $conversationHistory, $contextData, $intent);
    
    Response::success([
        'response' => $aiResponse,
        'intent' => $intent,
        'context_data' => $contextData
    ], 'AI response generated successfully.');
    
} catch (Exception $e) {
    Response::error('Failed to generate AI response: ' . $e->getMessage());
}

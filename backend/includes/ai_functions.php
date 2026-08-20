<?php
// backend/includes/ai_functions.php
// AI-powered library assistant functions

require_once __DIR__ . '/../config/constants.php';

/**
 * Analyze user intent from message
 */
function analyzeIntent($message) {
    $message = strtolower($message);
    
    // Book search intent
    if (preg_match('/(search|find|look for|looking for|want|need|show me).*book/i', $message)) {
        return 'book_search';
    }
    
    // User books/fines intent
    if (preg_match('/(my books|borrowed|check my|my fines|my loans|my transactions)/i', $message)) {
        return 'user_books';
    }
    
    // Library rules intent
    if (preg_match('/(rules|policy|borrowing|how long|how many|late fees|fines|renew|return)/i', $message)) {
        return 'library_rules';
    }
    
    // Recommendations intent
    if (preg_match('/(recommend|suggest|what should i read|good book|like to read)/i', $message)) {
        return 'recommendations';
    }
    
    return 'general';
}

/**
 * Extract search terms from message
 */
function extractSearchTerms($message) {
    // Remove common words and extract key terms
    $stopWords = ['search', 'find', 'look for', 'looking for', 'want', 'need', 'show me', 'book', 'books', 'about', 'on', 'the', 'a', 'an'];
    $terms = $message;
    
    foreach ($stopWords as $stopWord) {
        $terms = str_ireplace($stopWord, '', $terms);
    }
    
    // Clean up and return
    $terms = trim(preg_replace('/\s+/', ' ', $terms));
    return $terms;
}

/**
 * Search books in database
 */
function searchBooks($db, $searchTerms) {
    $terms = explode(' ', $searchTerms);
    $whereConditions = [];
    $params = [];
    
    foreach ($terms as $index => $term) {
        if (strlen($term) > 2) {
            $param = ':term' . $index;
            $whereConditions[] = "(b.title LIKE $param OR b.author LIKE $param OR b.category LIKE $param OR b.description LIKE $param)";
            $params[$param] = '%' . $term . '%';
        }
    }
    
    if (empty($whereConditions)) {
        return [];
    }
    
    $whereSql = 'WHERE ' . implode(' OR ', $whereConditions);
    
    $sql = "
        SELECT 
            b.id,
            b.title,
            b.author,
            b.isbn,
            b.category,
            b.year,
            b.description,
            b.cover_image,
            b.available_copies,
            b.total_copies,
            b.status
        FROM books b
        $whereSql
        AND b.status = 'available'
        ORDER BY 
            CASE 
                WHEN b.title LIKE :exact_match THEN 1
                WHEN b.author LIKE :exact_match THEN 2
                ELSE 3
            END,
            b.available_copies DESC
        LIMIT 10
    ";
    
    $params[':exact_match'] = '%' . $searchTerms . '%';
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

/**
 * Get user's borrowed books
 */
function getUserBooks($db, $userId) {
    $sql = "
        SELECT 
            t.transaction_id,
            t.borrow_date,
            t.due_date,
            t.return_date,
            t.renewals,
            t.status,
            b.title,
            b.author,
            b.isbn,
            b.cover_image
        FROM transactions t
        JOIN books b ON t.book_id = b.id
        WHERE t.user_id = :user_id
        AND t.status IN ('active', 'overdue')
        ORDER BY t.due_date ASC
    ";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([':user_id' => $userId]);
    return $stmt->fetchAll();
}

/**
 * Get user's unpaid fines
 */
function getUserFines($db, $userId) {
    $sql = "
        SELECT 
            f.fine_id,
            f.amount,
            f.reason,
            f.status,
            f.created_at,
            b.title
        FROM fines f
        JOIN transactions t ON f.transaction_id = t.id
        JOIN books b ON t.book_id = b.id
        WHERE f.user_id = :user_id
        AND f.status = 'unpaid'
        ORDER BY f.created_at DESC
    ";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([':user_id' => $userId]);
    return $stmt->fetchAll();
}

/**
 * Get library rules
 */
function getLibraryRules() {
    return [
        'borrow_duration' => BORROW_DURATION_DAYS . ' days',
        'max_books' => MAX_BORROWED_BOOKS . ' books',
        'fine_rate' => '₱' . number_format(FINE_RATE_PER_DAY, 2) . ' per day',
        'renewals' => 'Books can be renewed if not reserved by others',
        'overdue' => 'Late returns incur daily fines',
        'lost_books' => 'Lost books must be paid for or replaced'
    ];
}

/**
 * Get book recommendations based on message
 */
function getBookRecommendations($db, $message) {
    // Extract potential categories or topics from message
    $categories = ['fiction', 'non-fiction', 'science', 'history', 'technology', 'biography', 'mystery', 'romance', 'fantasy', 'self-help'];
    $matchedCategory = null;
    
    foreach ($categories as $category) {
        if (stripos($message, $category) !== false) {
            $matchedCategory = $category;
            break;
        }
    }
    
    $sql = "
        SELECT 
            b.id,
            b.title,
            b.author,
            b.category,
            b.year,
            b.cover_image,
            b.available_copies,
            b.description
        FROM books b
        WHERE b.status = 'available'
        AND b.available_copies > 0
    ";
    
    $params = [];
    
    if ($matchedCategory) {
        $sql .= " AND (b.category LIKE :category OR b.description LIKE :category)";
        $params[':category'] = '%' . $matchedCategory . '%';
    }
    
    $sql .= " ORDER BY b.available_copies DESC LIMIT 5";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

/**
 * Generate AI response (placeholder for actual AI integration)
 */
function generateAIResponse($message, $conversationHistory, $contextData, $intent) {
    // 1. Try to use Local AI (Qwen LLM on http://127.0.0.1:1234)
    require_once __DIR__ . '/LocalAiService.php';
    $localAi = new LocalAiService();
    $aiResponse = $localAi->generateResponse($message, $conversationHistory, $contextData, $intent);
    if ($aiResponse !== null && !empty($aiResponse)) {
        return $aiResponse;
    }

    // 2. Cloud Fallback: Gemini AI if configured
    if (file_exists(__DIR__ . '/GeminiService.php')) {
        require_once __DIR__ . '/GeminiService.php';
        $geminiService = new GeminiService();
        if ($geminiService->isConfigured()) {
            $geminiResponse = $geminiService->generateResponse($message, $conversationHistory, $contextData, $intent);
            if ($geminiResponse !== null) {
                return $geminiResponse;
            }
        }
    }
    
    // Rule-based response system as fallback
    switch ($intent) {
        case 'book_search':
            return generateBookSearchResponse($contextData['books'], $message);
            
        case 'user_books':
            return generateUserBooksResponse($contextData['user_books'], $contextData['user_fines']);
            
        case 'library_rules':
            return generateLibraryRulesResponse($contextData['rules']);
            
        case 'recommendations':
            return generateRecommendationsResponse($contextData['recommendations'], $message);
            
        default:
            return generateGeneralResponse($message, $contextData);
    }
}

/**
 * Generate book search response
 */
function generateBookSearchResponse($books, $originalMessage) {
    if (empty($books)) {
        return "Hmm, I couldn't find any books matching that search. 😕 But don't worry! Let's try different keywords or you can browse our full catalog. You can search by title, author, category, or subject - I'm happy to help you find something great! What else would you like to look for?";
    }
    
    $response = "Great news! 🎉 I found " . count($books) . " book(s) that might interest you:\n\n";
    
    foreach ($books as $index => $book) {
        $availability = $book['available_copies'] > 0 
            ? "{$book['available_copies']} copy(ies) available" 
            : "Currently unavailable";
        
        $response .= ($index + 1) . ". **📚 {$book['title']}** by {$book['author']}\n";
        $response .= "   Category: {$book['category']} | Year: {$book['year']}\n";
        $response .= "   Status: $availability\n\n";
    }
    
    $response .= "Would you like more details about any of these books? Or would you like me to help you find something else? I'm here to help! 😊";
    
    return $response;
}

/**
 * Generate user books response
 */
function generateUserBooksResponse($books, $fines) {
    $response = "";
    
    if (empty($books)) {
        $response .= "You currently don't have any borrowed books. 📚 That's a perfect opportunity to explore our catalog and find your next great read! Feel free to ask me for recommendations or browse our collection. What genre interests you? 😊\n\n";
    } else {
        $response .= "Here's what you currently have checked out:\n\n";
        
        foreach ($books as $book) {
            $status = $book['status'] === 'overdue' ? '⚠️ OVERDUE' : '✅ Active';
            $response .= "- **📖 {$book['title']}** by {$book['author']}\n";
            $response .= "  Due: {$book['due_date']} | Status: $status\n";
            if ($book['renewals'] > 0) {
                $response .= "  Renewals: {$book['renewals']}\n";
            }
            $response .= "\n";
        }
    }
    
    if (empty($fines)) {
        $response .= "✅ Great job! You have no unpaid fines. Your account is in perfect standing! Keep up the good work! 🎉";
    } else {
        $totalFines = array_sum(array_column($fines, 'amount'));
        $response .= "💰 Just a heads up - you have " . count($fines) . " unpaid fine(s) totaling ₱" . number_format($totalFines, 2) . ":\n\n";
        
        foreach ($fines as $fine) {
            $response .= "- ₱" . number_format($fine['amount'], 2) . " for \"{$fine['title']}\"\n";
            $response .= "  Reason: {$fine['reason']}\n";
            $response .= "  Date: {$fine['created_at']}\n\n";
        }
        
        $response .= "No worries! Just drop by the library desk to take care of these fines when you can. Let me know if you have any questions about them! 😊";
    }
    
    return $response;
}

/**
 * Generate library rules response
 */
function generateLibraryRulesResponse($rules) {
    $response = "Here are our library policies - let me know if you have any questions! 😊\n\n";
    
    $response .= "📚 **Borrowing Rules:**\n";
    $response .= "- Maximum books: {$rules['max_books']}\n";
    $response .= "- Loan duration: {$rules['borrow_duration']}\n";
    $response .= "- Renewals: {$rules['renewals']}\n\n";
    
    $response .= "💰 **Fines & Fees:**\n";
    $response .= "- Late fee: {$rules['fine_rate']}\n";
    $response .= "- Overdue books incur daily fines until returned\n\n";
    
    $response .= "📖 **General Policies:**\n";
    $response .= "- {$rules['overdue']}\n";
    $response .= "- {$rules['lost_books']}\n\n";
    
    $response .= "These policies help us keep our collection available for everyone! If anything is unclear or you have special circumstances, feel free to ask - I'm happy to help! 📚";
    
    return $response;
}

/**
 * Generate recommendations response
 */
function generateRecommendationsResponse($books, $originalMessage) {
    if (empty($books)) {
        return "Hmm, I couldn't find specific recommendations based on that request. 😕 But don't worry! I'd love to help you find something great. What genres do you enjoy? Fiction, non-fiction, mystery, romance, science fiction? Tell me what you're in the mood for and I'll do my best to find the perfect book for you! 📚";
    }
    
    $response = "Based on your interest, here are some books I think you'll love! 🎉\n\n";
    
    foreach ($books as $index => $book) {
        $response .= ($index + 1) . ". **📚 {$book['title']}** by {$book['author']}\n";
        $response .= "   Category: {$book['category']} | Year: {$book['year']}\n";
        if (!empty($book['description'])) {
            $description = substr($book['description'], 0, 100) . '...';
            $response .= "   Description: $description\n";
        }
        $response .= "\n";
    }
    
    $response .= "These look like great choices! Would you like more details about any of them? Or would you like recommendations in a different genre? I'm here to help you find your next favorite book! 😊";
    
    return $response;
}

/**
 * Generate general response
 */
function generateGeneralResponse($message, $contextData) {
    $userName = $contextData['user_name'] ?? 'there';
    
    $responses = [
        "Hey $userName! 👋 I'm so happy to help you with the library! I can assist you with finding books, checking your account, explaining our policies, or giving you personalized book recommendations. What would you like to explore today? 📚",
        "Hi there, $userName! 😊 I'm your friendly library assistant, and I'm here to make your library experience amazing! Whether you need help searching for books, want to check on your borrowed items, have questions about our policies, or just want some great reading recommendations - I've got you covered! What's on your mind?",
        "Hello $userName! 🎉 It's great to chat with you! I love helping library members discover amazing books and navigate our services. Feel free to ask me anything about our collection, your account, library rules, or let me recommend your next favorite read. How can I brighten your day with books? 📖"
    ];
    
    return $responses[array_rand($responses)];
}

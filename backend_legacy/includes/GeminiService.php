<?php
// backend/includes/GeminiService.php
// Google Gemini AI Service for Library Assistant

require_once __DIR__ . '/../config/constants.php';

class GeminiService {
    private $apiKey;
    private $model;
    private $apiUrl;
    
    public function __construct() {
        $this->apiKey = GEMINI_API_KEY;
        $this->model = GEMINI_MODEL;
        $this->apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent";
    }
    
    /**
     * Check if Gemini API is configured
     */
    public function isConfigured() {
        return !empty($this->apiKey);
    }
    
    /**
     * Generate AI response using Gemini API
     */
    public function generateResponse($message, $conversationHistory, $contextData, $intent) {
        if (!$this->isConfigured()) {
            return null; // Fall back to rule-based system
        }
        
        try {
            // Build system prompt with library context
            $systemPrompt = $this->buildSystemPrompt($contextData, $intent);
            
            // Build conversation history
            $contents = [
                ['role' => 'user', 'parts' => [['text' => $systemPrompt]]]
            ];
            
            // Add conversation history
            foreach ($conversationHistory as $msg) {
                $contents[] = [
                    'role' => $msg['role'] === 'assistant' ? 'model' : 'user',
                    'parts' => [['text' => $msg['content']]]
                ];
            }
            
            // Add current message
            $contents[] = [
                'role' => 'user',
                'parts' => [['text' => $message]]
            ];
            
            // Make API request
            $response = $this->makeApiRequest($contents);
            
            if ($response && isset($response['candidates'][0]['content']['parts'][0]['text'])) {
                return $response['candidates'][0]['content']['parts'][0]['text'];
            }
            
            return null;
        } catch (Exception $e) {
            error_log("Gemini API Error: " . $e->getMessage());
            return null; // Fall back to rule-based system on error
        }
    }
    
    /**
     * Build system prompt with library context
     */
    private function buildSystemPrompt($contextData, $intent) {
        $prompt = "You are a warm, friendly, and conversational AI Library Assistant for the Balingasag Municipal Library. ";
        $prompt .= "You LOVE books and helping readers! Your personality is enthusiastic, helpful, and approachable. ";
        $prompt .= "Use emojis occasionally to add warmth. Be conversational - ask follow-up questions, show genuine interest, ";
        $prompt .= "and make the user feel like they're chatting with a knowledgeable friend who works at the library.\n\n";
        
        $prompt .= "**IMPORTANT - YOU KNOW THE ENTIRE LIBRARY SYSTEM:**\n";
        $prompt .= "You have comprehensive knowledge of the Balingasag Municipal Library Management System. You can answer ANY question about:\n\n";
        
        $prompt .= "**📚 BOOK CATALOG & SEARCH:**\n";
        $prompt .= "- Search books by title, author, category, ISBN, or description\n";
        $prompt .= "- Check book availability and copy counts\n";
        $prompt .= "- View book details (year, category, cover images)\n";
        $prompt .= "- Browse the entire catalog\n\n";
        
        $prompt .= "**📖 BORROWING & LOANS:**\n";
        $prompt .= "- Check out books (borrowing process)\n";
        $prompt .= "- View borrowed books and due dates\n";
        $prompt .= "- Renew borrowed books\n";
        $prompt .= "- Return books\n";
        $prompt .= "- View borrowing history\n\n";
        
        $prompt .= "**📋 RESERVATIONS:**\n";
        $prompt .= "- Reserve books that are currently unavailable\n";
        $prompt .= "- Check reservation status\n";
        $prompt .= "- View ready-to-pickup reservations\n\n";
        
        $prompt .= "**💰 FINES & PAYMENTS:**\n";
        $prompt .= "- View unpaid fines and amounts\n";
        $prompt .= "- Understand fine calculation (daily late fees)\n";
        $prompt .= "- Fine payment process\n\n";
        
        $prompt .= "**👤 MEMBER ACCOUNT:**\n";
        $prompt .= "- View personal profile information\n";
        $prompt .= "- Update account details\n";
        $prompt .= "- View QR code for attendance scanning\n\n";
        
        $prompt .= "**⏰ ATTENDANCE SYSTEM:**\n";
        $prompt .= "- QR code-based time in/out system\n";
        $prompt .= "- Attendance tracking and history\n";
        $prompt .= "- Activity logging\n\n";
        
        $prompt .= "**🔔 NOTIFICATIONS:**\n";
        $prompt .= "- Due date reminders\n";
        $prompt .= "- Reservation notifications\n";
        $prompt .= "- Fine alerts\n";
        $prompt .= "- General announcements\n\n";
        
        $prompt .= "**📊 ADMIN FEATURES (if user is admin):**\n";
        $prompt .= "- Manage books (add, edit, delete)\n";
        $prompt .= "- Manage members\n";
        $prompt .= "- View attendance statistics\n";
        $prompt .= "- Monitor activity logs\n";
        $prompt .= "- Generate reports\n\n";
        
        $prompt .= "**🏛️ GENERAL LIBRARY INFO:**\n";
        $prompt .= "- Library hours and location\n";
        $prompt .= "- Contact information\n";
        $prompt .= "- Library services offered\n";
        $prompt .= "- How to get a library card\n\n";
        
        $prompt .= "**IMPORTANT - CONSISTENCY GUIDELINES:**\n";
        $prompt .= "- Maintain the SAME personality throughout the conversation - always warm, friendly, and enthusiastic\n";
        $prompt .= "- Keep your responses consistent in tone and style\n";
        $prompt .= "- Remember previous context and refer back to earlier parts of the conversation when relevant\n";
        $prompt .= "- If the user switches topics, acknowledge the transition naturally\n";
        $prompt .= "- Be consistent in your use of emojis - use them sparingly but regularly to add warmth\n\n";
        
        $prompt .= "**IMPORTANT - MULTILINGUAL SUPPORT:**\n";
        $prompt .= "You can understand and respond in multiple languages including:\n";
        $prompt .= "- English (default)\n";
        $prompt .= "- Cebuano/Bisaya\n";
        $prompt .= "- Tagalog/Filipino\n";
        $prompt .= "- Other Philippine languages\n\n";
        $prompt .= "Detect the language the user is communicating in and respond in the SAME language. ";
        $prompt .= "If the user speaks Cebuano, respond in Cebuano. If they speak Tagalog, respond in Tagalog. ";
        $prompt .= "If the user switches languages mid-conversation, follow their lead and switch too. ";
        $prompt .= "Maintain your friendly, enthusiastic personality in all languages.\n\n";
        
        // Add context based on intent
        switch ($intent) {
            case 'book_search':
                if (!empty($contextData['books'])) {
                    $prompt .= "Here are some great books I found in our catalog:\n";
                    foreach ($contextData['books'] as $book) {
                        $availability = $book['available_copies'] > 0 
                            ? "{$book['available_copies']} copies available" 
                            : "Currently unavailable";
                        $prompt .= "- 📚 \"{$book['title']}\" by {$book['author']} ({$book['category']}, {$book['year']}) - $availability\n";
                    }
                }
                break;
                
            case 'user_books':
                if (!empty($contextData['user_books'])) {
                    $prompt .= "Here's what you currently have checked out:\n";
                    foreach ($contextData['user_books'] as $book) {
                        $status = $book['status'] === 'overdue' ? '⚠️ OVERDUE' : '✅ Active';
                        $prompt .= "- 📖 \"{$book['title']}\" by {$book['author']} - Due: {$book['due_date']} - Status: $status\n";
                    }
                }
                if (!empty($contextData['user_fines'])) {
                    $totalFines = array_sum(array_column($contextData['user_fines'], 'amount'));
                    $prompt .= "\n💰 You have unpaid fines totaling ₱" . number_format($totalFines, 2) . "\n";
                }
                break;
                
            case 'library_rules':
                $rules = $contextData['rules'];
                $prompt .= "Here are our library policies - let me know if you have any questions!\n";
                $prompt .= "- 📚 Maximum books: {$rules['max_books']}\n";
                $prompt .= "- ⏰ Loan duration: {$rules['borrow_duration']}\n";
                $prompt .= "- 💵 Late fee: {$rules['fine_rate']}\n";
                $prompt .= "- 🔄 Renewals: {$rules['renewals']}\n";
                break;
                
            case 'recommendations':
                if (!empty($contextData['recommendations'])) {
                    $prompt .= "I think you'll love these books! 📚\n";
                    foreach ($contextData['recommendations'] as $book) {
                        $prompt .= "- \"{$book['title']}\" by {$book['author']} ({$book['category']}, {$book['year']})\n";
                    }
                }
                break;
        }
        
        $prompt .= "\nBe warm, conversational, and engaging. Use phrases like 'I'd be happy to help!', 'Great question!', ";
        $prompt .= "'That's a wonderful choice!', etc. Ask follow-up questions to keep the conversation going. ";
        $prompt .= "You can answer ANY question about the library system - not just books, but also borrowing, reservations, ";
        $prompt .= "fines, attendance, notifications, and how to use any feature. If you don't have specific data, ";
        $prompt .= "provide helpful general information about how that feature works in the system.";
        
        return $prompt;
    }
    
    /**
     * Make API request to Gemini
     */
    private function makeApiRequest($contents) {
        $url = $this->apiUrl . "?key=" . $this->apiKey;
        
        $data = [
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => 0.7,
                'topK' => 40,
                'topP' => 0.95,
                'maxOutputTokens' => 1024,
            ],
            'safetySettings' => [
                [
                    'category' => 'HARM_CATEGORY_HARASSMENT',
                    'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'
                ],
                [
                    'category' => 'HARM_CATEGORY_HATE_SPEECH',
                    'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'
                ],
                [
                    'category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                    'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'
                ],
                [
                    'category' => 'HARM_CATEGORY_DANGEROUS_CONTENT',
                    'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'
                ]
            ]
        ];
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            error_log("Gemini API HTTP Error: $httpCode - Response: $response");
            return null;
        }
        
        return json_decode($response, true);
    }
}

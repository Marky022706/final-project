<?php
// backend/includes/LocalAiService.php
// Local AI Service using LM Studio / OpenAI-compatible API at http://127.0.0.1:1234 (qwen/qwen3-1.7b)

require_once __DIR__ . '/../config/constants.php';

class LocalAiService {
    private string $baseUrl;
    private string $model;
    private int $timeout;

    public function __construct() {
        $this->baseUrl = rtrim(defined('LOCAL_AI_BASE_URL') ? LOCAL_AI_BASE_URL : 'http://127.0.0.1:1234', '/');
        $this->model = defined('LOCAL_AI_MODEL') ? LOCAL_AI_MODEL : 'qwen/qwen3-1.7b';
        $this->timeout = defined('LOCAL_AI_TIMEOUT') ? LOCAL_AI_TIMEOUT : 45;
    }

    /**
     * Check if local AI server is accessible
     */
    public function isAvailable(): bool {
        $ch = curl_init($this->baseUrl . '/v1/models');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 3);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        return $code === 200;
    }

    /**
     * Generate conversational response for Library Chatbot
     */
    public function generateResponse(string $message, array $conversationHistory, array $contextData, string $intent): ?string {
        try {
            $systemPrompt = $this->buildSystemPrompt($contextData, $intent);

            $messages = [
                ['role' => 'system', 'content' => $systemPrompt]
            ];

            // Append prior conversation history
            foreach ($conversationHistory as $msg) {
                if (!empty($msg['content'])) {
                    $role = ($msg['role'] ?? '') === 'assistant' ? 'assistant' : 'user';
                    $messages[] = [
                        'role' => $role,
                        'content' => $msg['content']
                    ];
                }
            }

            // Append current user message
            $messages[] = [
                'role' => 'user',
                'content' => $message
            ];

            $payload = [
                'model' => $this->model,
                'messages' => $messages,
                'temperature' => 0.7,
                'max_tokens' => 800
            ];

            $response = $this->makePostRequest('/v1/chat/completions', $payload);
            if ($response && isset($response['choices'][0]['message']['content'])) {
                return trim($response['choices'][0]['message']['content']);
            }

            return null;
        } catch (Exception $e) {
            error_log("Local AI Chat Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Look up and extract book metadata for Quick ISBN / Catalog Lookup
     */
    public function lookupBook(string $query): ?array {
        try {
            $systemPrompt = "You are a library bibliographic cataloging specialist. Given a book ISBN or Title, you must provide the accurate book metadata formatted strictly as JSON with no surrounding text or markdown ticks. The JSON schema must be:\n"
                . "{\n"
                . "  \"title\": \"Full Book Title\",\n"
                . "  \"author\": \"Primary Author Name\",\n"
                . "  \"publisher\": \"Publisher or Imprint Name\",\n"
                . "  \"category\": \"Fiction | Non-Fiction | Science & Technology | Philippine History | Academic Research | Biography & Memoir | Philosophy & Psychology | Literature & Poetry | Children's Books | General Reference\",\n"
                . "  \"year\": 2020,\n"
                . "  \"isbn\": \"Formatted ISBN\",\n"
                . "  \"format\": \"Paperback | Hardcover | eBook | Reference Volume\",\n"
                . "  \"shelf_location\": \"Main Shelf | Filipiniana Section | Reference Area | Fiction Bay A | Science & Tech Bay C\",\n"
                . "  \"description\": \"Comprehensive 2-3 sentence overview of the book\"\n"
                . "}";

            $messages = [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => "Lookup book bibliographic metadata for: $query"]
            ];

            $payload = [
                'model' => $this->model,
                'messages' => $messages,
                'temperature' => 0.2,
                'max_tokens' => 600
            ];

            $response = $this->makePostRequest('/v1/chat/completions', $payload);
            if ($response && isset($response['choices'][0]['message']['content'])) {
                $content = trim($response['choices'][0]['message']['content']);
                // Clean up possible markdown code blocks
                $content = preg_replace('/^```(?:json)?\s*/i', '', $content);
                $content = preg_replace('/\s*```$/', '', $content);
                
                // Match first JSON object if surrounded by thought text
                if (preg_match('/\{[\s\S]*\}/', $content, $match)) {
                    $json = json_decode($match[0], true);
                    if ($json && !empty($json['title'])) {
                        return $json;
                    }
                }
            }

            return null;
        } catch (Exception $e) {
            error_log("Local AI Lookup Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Build comprehensive library system prompt
     */
    private function buildSystemPrompt(array $contextData, string $intent): string {
        $prompt = "You are the official AI Library Assistant for Balingasag Municipal Public Library in Misamis Oriental, Philippines. ";
        $prompt .= "You are warm, friendly, polite, and enthusiastic about books, reading, and public library services! ";
        $prompt .= "You can communicate fluently in English, Tagalog/Filipino, and Cebuano/Bisaya. Respond in whichever language the patron uses.\n\n";

        $prompt .= "LIBRARY KNOWLEDGE BASE:\n";
        $prompt .= "- Hours: Monday to Friday, 8:00 AM – 5:00 PM\n";
        $prompt .= "- Location: Municipal Hall Complex, Balingasag, Misamis Oriental\n";
        $prompt .= "- Policy: Maximum 3 borrowed books per patron, 14-day borrowing duration\n";
        $prompt .= "- Overdue fines: ₱5.00 per overdue book per day\n";
        $prompt .= "- Attendance: Patrons scan their QR Code upon entry (Time In) and exit (Time Out)\n";
        $prompt .= "- Reservations: Available for checked-out books with priority pickup upon return\n\n";

        if (!empty($contextData['books'])) {
            $prompt .= "CURRENT CATALOG SEARCH MATCHES:\n";
            foreach ($contextData['books'] as $book) {
                $avail = ($book['available_copies'] ?? 0) > 0 ? "({$book['available_copies']} copies available)" : "(Currently on loan)";
                $prompt .= "- \"{$book['title']}\" by {$book['author']} [{$book['category']}, {$book['year']}] - $avail\n";
            }
            $prompt .= "\n";
        }

        if (!empty($contextData['user_books'])) {
            $prompt .= "PATRON'S ACTIVE BORROWINGS:\n";
            foreach ($contextData['user_books'] as $b) {
                $prompt .= "- \"{$b['title']}\" (Due: {$b['due_date']}, Status: {$b['status']})\n";
            }
            $prompt .= "\n";
        }

        if (!empty($contextData['user_fines'])) {
            $total = array_sum(array_column($contextData['user_fines'], 'amount'));
            $prompt .= "PATRON'S UNPAID FINES: ₱" . number_format($total, 2) . "\n\n";
        }

        $prompt .= "Provide concise, helpful, and polite answers with appropriate emoji accents. If patrons ask how to borrow or reserve, guide them clearly.";
        return $prompt;
    }

    /**
     * Send HTTP POST request to Local AI server
     */
    private function makePostRequest(string $endpoint, array $payload): ?array {
        $url = $this->baseUrl . $endpoint;
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Accept: application/json'
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, $this->timeout);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);

        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if ($code !== 200 || empty($res)) {
            $err = curl_error($ch);
            error_log("Local AI API request failed (HTTP $code): $err");
            return null;
        }

        return json_decode($res, true);
    }
}

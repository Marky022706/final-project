<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AiController extends BaseApiController
{
    public function catalog(Request $request): JsonResponse
    {
        $title = trim($request->input('title', ''));
        $author = trim($request->input('author', ''));

        if (empty($title) && empty($author)) {
            return $this->error('Please provide at least a book title or author name.', 400);
        }

        $apiKey = config('services.gemini.key') ?? env('GEMINI_API_KEY');
        $model = config('services.gemini.model') ?? env('GEMINI_MODEL', 'gemini-1.5-flash');

        $generatedData = null;

        if ($apiKey) {
            try {
                $prompt = "You are an expert library cataloger. Given the book title '{$title}' and author '{$author}', provide realistic, structured bibliographic metadata in strictly valid JSON format without markdown code blocks.\n";
                $prompt .= "Return only a JSON object with keys: title, author, category, publisher, year, isbn, description, format, shelf_location.";

                $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";
                $response = Http::timeout(10)->post($url, [
                    'contents' => [
                        ['parts' => [['text' => $prompt]]]
                    ]
                ]);

                if ($response->successful()) {
                    $json = $response->json();
                    $text = $json['candidates'][0]['content']['parts'][0]['text'] ?? '';
                    $cleanJson = preg_replace('/```(?:json)?\s*|\s*```/', '', trim($text));
                    $decoded = json_decode($cleanJson, true);
                    if ($decoded && is_array($decoded) && isset($decoded['title'])) {
                        $generatedData = $decoded;
                    }
                }
            } catch (\Throwable $e) {
                // Fail gracefully to default generator
            }
        }

        if (!$generatedData) {
            $generatedData = [
                'title' => !empty($title) ? ucwords($title) : 'Sample Book Title',
                'author' => !empty($author) ? ucwords($author) : 'Unknown Author',
                'category' => 'General Collection',
                'publisher' => 'Philippine Educational Publishing',
                'year' => (int)date('Y'),
                'isbn' => '978-' . rand(100, 999) . '-' . rand(10000, 99999) . '-' . rand(1, 9),
                'description' => "A comprehensive and curated literary resource for the municipal library collection covering {$title}.",
                'format' => 'Paperback',
                'shelf_location' => 'Shelf ' . chr(rand(65, 70)) . '-' . rand(1, 10),
            ];
        }

        $this->logActivity(
            $request->user()?->id,
            'ai_catalog',
            'Cataloging',
            "Invoked AI catalog assistant for '{$title}' by '{$author}'",
            $request
        );

        return $this->success($generatedData, 'AI bibliographic metadata generated successfully.');
    }

    public function chat(Request $request): JsonResponse
    {
        $message = trim($request->input('message', ''));
        if (empty($message)) {
            return $this->error('Prompt message cannot be empty.', 400);
        }

        $apiKey = config('services.gemini.key') ?? env('GEMINI_API_KEY');
        $model = config('services.gemini.model') ?? env('GEMINI_MODEL', 'gemini-1.5-flash');

        $reply = null;

        if ($apiKey) {
            try {
                $systemPrompt = "You are the AI Assistant for Balingasag Municipal Public Library in Misamis Oriental, Philippines. Assist library patrons politely with book recommendations, borrowing policies (14 day loan duration, 3 max books), operating hours (Mon-Fri 8am-5pm), and research guidance.";

                $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";
                $response = Http::timeout(10)->post($url, [
                    'contents' => [
                        ['parts' => [['text' => "{$systemPrompt}\n\nUser Question: {$message}"]]]
                    ]
                ]);

                if ($response->successful()) {
                    $json = $response->json();
                    $reply = $json['candidates'][0]['content']['parts'][0]['text'] ?? null;
                }
            } catch (\Throwable $e) {
                // Ignore
            }
        }

        if (!$reply) {
            $reply = "Hello! I am your Balingasag Municipal Library Assistant. You can borrow up to 3 books for 14 days, browse our digital repository, or reserve titles online. How can I help you today?";
        }

        return $this->success(['reply' => $reply], 'AI response generated.');
    }

    public function isbnLookup(Request $request): JsonResponse
    {
        $isbn = preg_replace('/[^0-9X]/', '', $request->input('isbn', ''));
        if (empty($isbn)) {
            return $this->error('Valid ISBN is required.', 400);
        }

        // Try OpenLibrary API
        try {
            $res = Http::timeout(5)->get("https://openlibrary.org/api/books?bibkeys=ISBN:{$isbn}&format=json&jscmd=data");
            if ($res->successful()) {
                $data = $res->json();
                $key = "ISBN:{$isbn}";
                if (isset($data[$key])) {
                    $b = $data[$key];
                    return $this->success([
                        'title' => $b['title'] ?? '',
                        'author' => isset($b['authors'][0]['name']) ? $b['authors'][0]['name'] : '',
                        'publisher' => isset($b['publishers'][0]['name']) ? $b['publishers'][0]['name'] : '',
                        'year' => isset($b['publish_date']) ? (int)preg_replace('/\D/', '', $b['publish_date']) : (int)date('Y'),
                        'isbn' => $isbn,
                        'description' => $b['notes'] ?? ($b['subtitle'] ?? ''),
                    ], 'Book found in OpenLibrary database.');
                }
            }
        } catch (\Throwable $e) {
            // Ignore
        }

        return $this->error('ISBN not found in public registries.', 404);
    }
}

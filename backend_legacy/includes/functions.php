<?php
// backend/includes/functions.php
require_once __DIR__ . '/../config/constants.php';

class Utils {
    /**
     * Recursively sanitize input data (handles arrays and strings)
     */
    public static function sanitize($data) {
        if (is_array($data)) {
            foreach ($data as $key => $value) {
                $data[$key] = self::sanitize($value);
            }
            return $data;
        }
        if (is_string($data)) {
            return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
        }
        return $data;
    }

    /**
     * Validate required parameters from an input source
     */
    public static function checkRequired($requiredFields, $source) {
        $missing = [];
        foreach ($requiredFields as $field) {
            if (!isset($source[$field]) || $source[$field] === '' || $source[$field] === null) {
                $missing[] = $field;
            }
        }
        return $missing;
    }

    /**
     * Parse raw JSON requests (common in REST APIs)
     */
    public static function getJsonInput() {
        $raw = file_get_contents('php://input');
        if (empty($raw)) return [];
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? self::sanitize($decoded) : [];
    }

    /**
     * Calculate overdue days based on due date and return date (or current date)
     */
    public static function calculateOverdueDays($dueDate, $returnDate = null) {
        $due = new DateTime($dueDate);
        $end = new DateTime($returnDate ?? date('Y-m-d'));
        
        // If not overdue, return 0
        if ($end <= $due) {
            return 0;
        }
        
        $interval = $due->diff($end);
        return (int)$interval->format('%a');
    }

    /**
     * Calculate fine amount based on overdue days
     */
    public static function calculateFineAmount($overdueDays) {
        if ($overdueDays <= 0) return 0.00;
        return round($overdueDays * FINE_RATE_PER_DAY, 2);
    }

    /**
     * Generate unique Transaction/Fine ID
     */
    public static function generateId($prefix = 'TXN') {
        return $prefix . '-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -5));
    }
}

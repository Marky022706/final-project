<?php
// backend/includes/activity_logger.php
// Activity logging helper functions for audit trail

require_once __DIR__ . '/../config/database.php';

/**
 * Log user activity to the activity_logs table
 * 
 * @param int $userId - The ID of the user performing the action
 * @param string $action - The action performed (e.g., 'created', 'updated', 'deleted', 'borrowed', 'returned')
 * @param string $module - The module where the action occurred (e.g., 'Books', 'Users', 'Transactions', 'Inventory')
 * @param string $description - Detailed description of the action
 * @param string|null $previousValue - Previous value for data changes (optional)
 * @param string|null $newValue - New value for data changes (optional)
 * @param int|null $relatedEntityId - ID of related entity (optional)
 * @param string|null $relatedEntityType - Type of related entity (optional)
 * @return bool - True if logging was successful, false otherwise
 */
function logActivity($userId, $action, $module, $description, $previousValue = null, $newValue = null, $relatedEntityId = null, $relatedEntityType = null) {
    try {
        $db = Database::getConnection();
        
        // Get client IP and user agent
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;
        
        $sql = "
            INSERT INTO activity_logs (user_id, action, module, description, ip_address, user_agent, previous_value, new_value, related_entity_id, related_entity_type)
            VALUES (:user_id, :action, :module, :description, :ip_address, :user_agent, :previous_value, :new_value, :related_entity_id, :related_entity_type)
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':user_id' => $userId,
            ':action' => $action,
            ':module' => $module,
            ':description' => $description,
            ':ip_address' => $ipAddress,
            ':user_agent' => $userAgent,
            ':previous_value' => $previousValue,
            ':new_value' => $newValue,
            ':related_entity_id' => $relatedEntityId,
            ':related_entity_type' => $relatedEntityType
        ]);
        
        return true;
    } catch (PDOException $e) {
        error_log("Activity logging failed: " . $e->getMessage());
        return false;
    }
}

/**
 * Get activity logs with optional filtering
 * 
 * @param PDO $db - Database connection
 * @param array $filters - Optional filters (user_id, module, action, date_from, date_to, limit, offset)
 * @return array - Array of activity logs
 */
function getActivityLogs($db, $filters = []) {
    $whereClauses = [];
    $params = [];
    
    if (!empty($filters['user_id'])) {
        $whereClauses[] = "al.user_id = :user_id";
        $params[':user_id'] = $filters['user_id'];
    }
    
    if (!empty($filters['module'])) {
        $whereClauses[] = "al.module = :module";
        $params[':module'] = $filters['module'];
    }
    
    if (!empty($filters['action'])) {
        $whereClauses[] = "al.action = :action";
        $params[':action'] = $filters['action'];
    }
    
    if (!empty($filters['date_from'])) {
        $whereClauses[] = "al.created_at >= :date_from";
        $params[':date_from'] = $filters['date_from'];
    }
    
    if (!empty($filters['date_to'])) {
        $whereClauses[] = "al.created_at <= :date_to";
        $params[':date_to'] = $filters['date_to'];
    }
    
    $whereSql = '';
    if (!empty($whereClauses)) {
        $whereSql = ' WHERE ' . implode(' AND ', $whereClauses);
    }
    
    $limit = !empty($filters['limit']) ? (int)$filters['limit'] : 50;
    $offset = !empty($filters['offset']) ? (int)$filters['offset'] : 0;
    
    $sql = "
        SELECT 
            al.id,
            al.user_id,
            al.action,
            al.module,
            al.description,
            al.ip_address,
            al.created_at,
            al.previous_value,
            al.new_value,
            al.related_entity_id,
            al.related_entity_type,
            u.first_name,
            u.last_name,
            u.email,
            u.role
        FROM activity_logs al
        JOIN users u ON al.user_id = u.id
        $whereSql
        ORDER BY al.created_at DESC
        LIMIT $limit OFFSET $offset
    ";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

/**
 * Get activity statistics
 * 
 * @param PDO $db - Database connection
 * @return array - Activity statistics
 */
function getActivityStats($db) {
    $stats = [];
    
    // Total activities
    $stmt = $db->query("SELECT COUNT(*) FROM activity_logs");
    $stats['total_activities'] = $stmt->fetchColumn();
    
    // Activities by module
    $stmt = $db->query("
        SELECT module, COUNT(*) as count 
        FROM activity_logs 
        GROUP BY module 
        ORDER BY count DESC
    ");
    $stats['by_module'] = $stmt->fetchAll();
    
    // Activities by action
    $stmt = $db->query("
        SELECT action, COUNT(*) as count 
        FROM activity_logs 
        GROUP BY action 
        ORDER BY count DESC
    ");
    $stats['by_action'] = $stmt->fetchAll();
    
    // Recent activities (last 7 days)
    $stmt = $db->query("
        SELECT COUNT(*) 
        FROM activity_logs 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    ");
    $stats['recent_activities'] = $stmt->fetchColumn();
    
    return $stats;
}

-- 安能物流农场游戏数据库初始化脚本
-- 适用于 MySQL 5.7+

-- 创建数据库（如果不存在）
-- CREATE DATABASE IF NOT EXISTS ane_farm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE ane_farm;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    nickname VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(255) DEFAULT 'assets/default-avatar.svg',
    branch_id VARCHAR(50) NOT NULL,
    branch_name VARCHAR(100) NOT NULL,
    level INT DEFAULT 1,
    exp INT DEFAULT 0,
    coins INT DEFAULT 1000,
    diamonds INT DEFAULT 50,
    station_slots INT DEFAULT 6,
    steal_count INT DEFAULT 0,
    status VARCHAR(100) DEFAULT '',
    is_banned TINYINT(1) DEFAULT 0,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_branch (branch_id),
    INDEX idx_nickname (nickname)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 用户道具表
CREATE TABLE IF NOT EXISTS user_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    item_id VARCHAR(50) NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    count INT DEFAULT 0,
    description VARCHAR(255) DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_item (user_id, item_id),
    INDEX idx_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 站场货物表
CREATE TABLE IF NOT EXISTS station_cargos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cargo_id VARCHAR(50) NOT NULL UNIQUE,
    user_id VARCHAR(50) NOT NULL,
    slot_index INT NOT NULL,
    type_id VARCHAR(50) NOT NULL,
    type_name VARCHAR(100) NOT NULL,
    start_time BIGINT NOT NULL,
    grow_time INT NOT NULL,
    value INT NOT NULL,
    exp INT NOT NULL,
    is_protected TINYINT(1) DEFAULT 0,
    stolen TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 好友关系表
CREATE TABLE IF NOT EXISTS friends (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    friend_id VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_friendship (user_id, friend_id),
    INDEX idx_user (user_id),
    INDEX idx_friend (friend_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 分拨聊天消息表
CREATE TABLE IF NOT EXISTS branch_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id VARCHAR(50) NOT NULL UNIQUE,
    branch_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    avatar VARCHAR(255) DEFAULT '',
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_branch (branch_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 世界聊天消息表
CREATE TABLE IF NOT EXISTS world_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id VARCHAR(50) NOT NULL UNIQUE,
    user_id VARCHAR(50) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    avatar VARCHAR(255) DEFAULT '',
    branch_id VARCHAR(50),
    branch_name VARCHAR(100),
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 私聊消息表
CREATE TABLE IF NOT EXISTS private_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id VARCHAR(50) NOT NULL UNIQUE,
    sender_id VARCHAR(50) NOT NULL,
    receiver_id VARCHAR(50) NOT NULL,
    sender_nickname VARCHAR(50) NOT NULL,
    sender_avatar VARCHAR(255) DEFAULT '',
    content TEXT NOT NULL,
    message_type ENUM('text', 'emoji', 'image', 'system') DEFAULT 'text',
    is_read TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sender (sender_id),
    INDEX idx_receiver (receiver_id),
    INDEX idx_conversation (sender_id, receiver_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 会话列表表
CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    target_user_id VARCHAR(50) NOT NULL,
    target_nickname VARCHAR(50) NOT NULL,
    target_avatar VARCHAR(255) DEFAULT '',
    last_message TEXT,
    last_message_type ENUM('text', 'emoji', 'image', 'system') DEFAULT 'text',
    last_message_time BIGINT NOT NULL,
    unread_count INT DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_conversation (user_id, target_user_id),
    INDEX idx_user (user_id),
    INDEX idx_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 成就记录表
CREATE TABLE IF NOT EXISTS user_achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    achievement_id VARCHAR(50) NOT NULL,
    claimed TINYINT(1) DEFAULT 0,
    progress TINYINT(1) DEFAULT 0,
    claimed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_achievement (user_id, achievement_id),
    INDEX idx_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 聊天统计表（用于成就）
CREATE TABLE IF NOT EXISTS chat_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    branch_count INT DEFAULT 0,
    world_count INT DEFAULT 0,
    total_count INT DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 签到记录表
CREATE TABLE IF NOT EXISTS check_ins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    last_check_in_date DATE,
    consecutive_days INT DEFAULT 0,
    total_check_ins INT DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 任务进度表
CREATE TABLE IF NOT EXISTS task_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    task_type ENUM('daily', 'weekly', 'challenge') NOT NULL,
    task_id VARCHAR(50) NOT NULL,
    progress INT DEFAULT 0,
    claimed TINYINT(1) DEFAULT 0,
    reset_date DATE,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_task (user_id, task_type, task_id),
    INDEX idx_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 排行榜表
CREATE TABLE IF NOT EXISTS rankings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    rank_type ENUM('coins', 'level', 'steal') NOT NULL,
    value INT DEFAULT 0,
    nickname VARCHAR(50) NOT NULL,
    avatar VARCHAR(255) DEFAULT '',
    branch_id VARCHAR(50),
    branch_name VARCHAR(100),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_rank (user_id, rank_type),
    INDEX idx_type_value (rank_type, value DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 用户在线状态表
CREATE TABLE IF NOT EXISTS online_status (
    user_id VARCHAR(50) NOT NULL PRIMARY KEY,
    is_online TINYINT(1) DEFAULT 0,
    last_seen DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

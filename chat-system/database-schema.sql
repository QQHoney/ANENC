-- 聊天系统数据库架构
-- 适用于Serv00 MySQL环境
-- 使用UTF-8编码，支持中文

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
  `email` VARCHAR(100) UNIQUE NOT NULL COMMENT '邮箱',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '密码哈希',
  `avatar` VARCHAR(255) DEFAULT '/images/default-avatar.png' COMMENT '头像URL',
  `status_message` VARCHAR(100) DEFAULT '在线' COMMENT '状态消息',
  `is_online` BOOLEAN DEFAULT FALSE COMMENT '在线状态',
  `last_login` DATETIME COMMENT '最后登录时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_username (`username`),
  INDEX idx_email (`email`),
  INDEX idx_online (`is_online`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 聊天室表
CREATE TABLE IF NOT EXISTS `rooms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT '房间名称',
  `description` VARCHAR(255) DEFAULT '' COMMENT '房间描述',
  `type` ENUM('public', 'private', 'group') DEFAULT 'public' COMMENT '房间类型',
  `created_by` INT COMMENT '创建者ID',
  `max_users` INT DEFAULT 100 COMMENT '最大用户数',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT '是否活跃',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX idx_type (`type`),
  INDEX idx_active (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 消息表
CREATE TABLE IF NOT EXISTS `messages` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `room_id` INT NOT NULL COMMENT '房间ID',
  `user_id` INT NOT NULL COMMENT '发送者ID',
  `content` TEXT NOT NULL COMMENT '消息内容',
  `message_type` ENUM('text', 'image', 'file', 'system') DEFAULT 'text' COMMENT '消息类型',
  `file_url` VARCHAR(255) DEFAULT NULL COMMENT '文件URL',
  `is_deleted` BOOLEAN DEFAULT FALSE COMMENT '是否删除',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
  FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX idx_room_time (`room_id`, `created_at`),
  INDEX idx_user (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户房间关系表（用于私聊和群组）
CREATE TABLE IF NOT EXISTS `user_rooms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '用户ID',
  `room_id` INT NOT NULL COMMENT '房间ID',
  `role` ENUM('member', 'admin', 'owner') DEFAULT 'member' COMMENT '用户角色',
  `nickname` VARCHAR(50) DEFAULT NULL COMMENT '在房间内的昵称',
  `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  `is_muted` BOOLEAN DEFAULT FALSE COMMENT '是否禁言',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE,
  UNIQUE KEY unique_user_room (`user_id`, `room_id`),
  INDEX idx_user (`user_id`),
  INDEX idx_room (`room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 好友关系表
CREATE TABLE IF NOT EXISTS `friends` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '用户ID',
  `friend_id` INT NOT NULL COMMENT '好友ID',
  `status` ENUM('pending', 'accepted', 'blocked') DEFAULT 'pending' COMMENT '好友状态',
  `action_user_id` INT NOT NULL COMMENT '操作用户ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`friend_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`action_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY unique_friend_pair (`user_id`, `friend_id`),
  INDEX idx_user_status (`user_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 消息已读状态表
CREATE TABLE IF NOT EXISTS `message_reads` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `message_id` BIGINT NOT NULL COMMENT '消息ID',
  `user_id` INT NOT NULL COMMENT '阅读者ID',
  `read_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '阅读时间',
  FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY unique_message_user (`message_id`, `user_id`),
  INDEX idx_user (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 系统通知表
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '接收用户ID',
  `type` ENUM('friend_request', 'message', 'system', 'room_invite') NOT NULL COMMENT '通知类型',
  `title` VARCHAR(100) NOT NULL COMMENT '通知标题',
  `content` VARCHAR(500) DEFAULT '' COMMENT '通知内容',
  `related_id` INT DEFAULT NULL COMMENT '相关ID（如好友ID、房间ID等）',
  `is_read` BOOLEAN DEFAULT FALSE COMMENT '是否已读',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX idx_user_unread (`user_id`, `is_read`),
  INDEX idx_type (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始化默认公共房间
INSERT INTO `rooms` (`name`, `description`, `type`, `created_by`, `max_users`)
VALUES ('公共大厅', '所有人可见的公共聊天室', 'public', NULL, 100);
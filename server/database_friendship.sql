-- 好友亲密度系统数据库迁移脚本
-- 在现有数据库基础上执行

-- 修改好友关系表，添加亲密度字段
ALTER TABLE friends
ADD COLUMN intimacy INT DEFAULT 0 COMMENT '亲密度值',
ADD COLUMN intimacy_level INT DEFAULT 1 COMMENT '亲密度等级 1-10',
ADD COLUMN last_interact DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '最后互动时间',
ADD COLUMN today_chat_count INT DEFAULT 0 COMMENT '今日聊天次数',
ADD COLUMN today_gift_count INT DEFAULT 0 COMMENT '今日送礼次数',
ADD COLUMN today_help_count INT DEFAULT 0 COMMENT '今日互助次数',
ADD COLUMN total_chat_count INT DEFAULT 0 COMMENT '累计聊天次数',
ADD COLUMN total_gift_count INT DEFAULT 0 COMMENT '累计送礼次数',
ADD COLUMN total_help_count INT DEFAULT 0 COMMENT '累计互助次数',
ADD COLUMN reset_date DATE COMMENT '每日计数重置日期';

-- 亲密度奖励领取记录表
CREATE TABLE IF NOT EXISTS intimacy_rewards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    friend_id VARCHAR(50) NOT NULL,
    reward_level INT NOT NULL COMMENT '领取的等级奖励',
    reward_coins INT DEFAULT 0,
    reward_diamonds INT DEFAULT 0,
    reward_items JSON COMMENT '领取的道具奖励',
    claimed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_friend_level (user_id, friend_id, reward_level),
    INDEX idx_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 好友互助记录表
CREATE TABLE IF NOT EXISTS friend_help_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    helper_id VARCHAR(50) NOT NULL COMMENT '帮助者',
    target_id VARCHAR(50) NOT NULL COMMENT '被帮助者',
    help_type ENUM('water', 'protect', 'speed', 'steal_back') NOT NULL COMMENT '帮助类型',
    cargo_id VARCHAR(50) COMMENT '相关货物ID',
    reward_coins INT DEFAULT 0 COMMENT '帮助获得的金币',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_helper (helper_id),
    INDEX idx_target (target_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 好友礼物记录表
CREATE TABLE IF NOT EXISTS friend_gift_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id VARCHAR(50) NOT NULL,
    receiver_id VARCHAR(50) NOT NULL,
    gift_type VARCHAR(50) NOT NULL COMMENT '礼物类型',
    gift_name VARCHAR(100) NOT NULL,
    intimacy_value INT DEFAULT 0 COMMENT '增加的亲密度',
    message VARCHAR(255) DEFAULT '' COMMENT '附带消息',
    is_read TINYINT(1) DEFAULT 0 COMMENT '是否已读',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sender (sender_id),
    INDEX idx_receiver (receiver_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 每日亲密度任务进度表
CREATE TABLE IF NOT EXISTS intimacy_daily_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    friend_id VARCHAR(50) NOT NULL,
    task_date DATE NOT NULL,
    chat_done TINYINT(1) DEFAULT 0 COMMENT '今日聊天任务',
    gift_done TINYINT(1) DEFAULT 0 COMMENT '今日送礼任务',
    help_done TINYINT(1) DEFAULT 0 COMMENT '今日互助任务',
    visit_done TINYINT(1) DEFAULT 0 COMMENT '今日拜访任务',
    intimacy_gained INT DEFAULT 0 COMMENT '今日获得的亲密度',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_daily (user_id, friend_id, task_date),
    INDEX idx_user (user_id),
    INDEX idx_date (task_date),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

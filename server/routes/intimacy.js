/**
 * 亲密度路由 - 好友亲密度系统
 */

const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// 亲密度等级配置
const INTIMACY_CONFIG = {
    // 等级阈值 [最小亲密度, 最大亲密度]
    levels: {
        1: { name: '点头之交', min: 0, max: 99, icon: '👋' },
        2: { name: '普通朋友', min: 100, max: 299, icon: '🤝' },
        3: { name: '熟悉好友', min: 300, max: 599, icon: '😊' },
        4: { name: '亲密好友', min: 600, max: 999, icon: '💛' },
        5: { name: '挚友', min: 1000, max: 1499, icon: '💚' },
        6: { name: '密友', min: 1500, max: 2099, icon: '💙' },
        7: { name: '至交', min: 2100, max: 2799, icon: '💜' },
        8: { name: '知己', min: 2800, max: 3599, icon: '❤️' },
        9: { name: '莫逆之交', min: 3600, max: 4499, icon: '💖' },
        10: { name: '生死之交', min: 4500, max: 999999, icon: '💎' }
    },
    // 每日亲密度上限
    dailyLimit: 100,
    // 各行为获得的亲密度
    actions: {
        chat: 5,           // 私聊一次
        gift_small: 10,    // 送小礼物
        gift_medium: 25,   // 送中礼物
        gift_large: 50,    // 送大礼物
        help: 15,          // 互助一次
        visit: 3,          // 拜访一次
        steal_forgive: 20  // 被截胡后原谅
    },
    // 等级奖励
    levelRewards: {
        2: { coins: 100, diamonds: 5, items: [{ id: 'protection_shield', count: 1 }] },
        3: { coins: 200, diamonds: 10, items: [{ id: 'speed_up', count: 2 }] },
        4: { coins: 300, diamonds: 15, items: [{ id: 'broadcast', count: 3 }] },
        5: { coins: 500, diamonds: 25, items: [{ id: 'protection_shield', count: 3 }] },
        6: { coins: 800, diamonds: 40, items: [{ id: 'speed_up', count: 5 }] },
        7: { coins: 1200, diamonds: 60, items: [{ id: 'steal_card', count: 2 }] },
        8: { coins: 1800, diamonds: 80, items: [{ id: 'protection_shield', count: 5 }, { id: 'speed_up', count: 3 }] },
        9: { coins: 2500, diamonds: 100, items: [{ id: 'broadcast', count: 10 }] },
        10: { coins: 5000, diamonds: 200, items: [{ id: 'protection_shield', count: 10 }, { id: 'speed_up', count: 10 }] }
    },
    // 礼物配置
    gifts: [
        { id: 'flower', name: '鲜花', price: 50, currency: 'coins', intimacy: 10, icon: '🌹', category: 'small' },
        { id: 'coffee', name: '咖啡', price: 80, currency: 'coins', intimacy: 15, icon: '☕', category: 'small' },
        { id: 'cake', name: '蛋糕', price: 150, currency: 'coins', intimacy: 25, icon: '🎂', category: 'medium' },
        { id: 'perfume', name: '香水', price: 300, currency: 'coins', intimacy: 40, icon: '🧴', category: 'medium' },
        { id: 'watch', name: '手表', price: 50, currency: 'diamonds', intimacy: 50, icon: '⌚', category: 'large' },
        { id: 'ring', name: '戒指', price: 100, currency: 'diamonds', intimacy: 80, icon: '💍', category: 'large' },
        { id: 'car', name: '跑车', price: 500, currency: 'diamonds', intimacy: 200, icon: '🚗', category: 'luxury' },
        { id: 'house', name: '别墅', price: 1000, currency: 'diamonds', intimacy: 500, icon: '🏠', category: 'luxury' }
    ]
};

// 获取亲密度配置
router.get('/config', authMiddleware, async (req, res) => {
    res.json({ success: true, data: INTIMACY_CONFIG });
});

// 获取与指定好友的亲密度信息
router.get('/friend/:friendId', authMiddleware, async (req, res) => {
    try {
        const { friendId } = req.params;
        const today = new Date().toISOString().split('T')[0];

        // 检查每日计数是否需要重置
        await resetDailyCountsIfNeeded(req.userId, friendId, today);

        const friendship = await db.queryOne(
            `SELECT f.*, u.nickname as friendNickname, u.avatar as friendAvatar, u.level as friendLevel
             FROM friends f
             JOIN users u ON f.friend_id = u.user_id
             WHERE f.user_id = ? AND f.friend_id = ?`,
            [req.userId, friendId]
        );

        if (!friendship) {
            return res.json({ success: false, message: '不是好友关系' });
        }

        // 获取今日已获得的亲密度
        const dailyProgress = await db.queryOne(
            `SELECT intimacy_gained FROM intimacy_daily_progress
             WHERE user_id = ? AND friend_id = ? AND task_date = ?`,
            [req.userId, friendId, today]
        );

        const levelInfo = getIntimacyLevel(friendship.intimacy || 0);
        const nextLevelInfo = INTIMACY_CONFIG.levels[levelInfo.level + 1];

        res.json({
            success: true,
            data: {
                friendId,
                friendNickname: friendship.friendNickname,
                friendAvatar: friendship.friendAvatar,
                friendLevel: friendship.friendLevel,
                intimacy: friendship.intimacy || 0,
                intimacyLevel: levelInfo.level,
                levelName: levelInfo.name,
                levelIcon: levelInfo.icon,
                nextLevelName: nextLevelInfo?.name || '已满级',
                nextLevelMin: nextLevelInfo?.min || 0,
                progress: nextLevelInfo ? ((friendship.intimacy - levelInfo.min) / (nextLevelInfo.min - levelInfo.min)) * 100 : 100,
                todayGained: dailyProgress?.intimacy_gained || 0,
                todayLimit: INTIMACY_CONFIG.dailyLimit,
                todayChatCount: friendship.today_chat_count || 0,
                todayGiftCount: friendship.today_gift_count || 0,
                todayHelpCount: friendship.today_help_count || 0,
                totalChatCount: friendship.total_chat_count || 0,
                totalGiftCount: friendship.total_gift_count || 0,
                totalHelpCount: friendship.total_help_count || 0,
                lastInteract: friendship.last_interact
            }
        });
    } catch (error) {
        console.error('获取亲密度信息错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取所有好友的亲密度列表
router.get('/list', authMiddleware, async (req, res) => {
    try {
        const friends = await db.query(
            `SELECT f.friend_id as friendId, f.intimacy, f.intimacy_level as intimacyLevel,
                    f.last_interact as lastInteract, f.total_chat_count as totalChatCount,
                    u.nickname, u.avatar, u.level, u.branch_name as branchName
             FROM friends f
             JOIN users u ON f.friend_id = u.user_id
             WHERE f.user_id = ?
             ORDER BY f.intimacy DESC`,
            [req.userId]
        );

        const result = friends.map(f => {
            const levelInfo = getIntimacyLevel(f.intimacy || 0);
            return {
                ...f,
                levelName: levelInfo.name,
                levelIcon: levelInfo.icon
            };
        });

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('获取亲密度列表错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 送礼物
router.post('/gift', authMiddleware, async (req, res) => {
    try {
        const { friendId, giftId, message } = req.body;

        // 验证好友关系
        const friendship = await db.queryOne(
            'SELECT * FROM friends WHERE user_id = ? AND friend_id = ?',
            [req.userId, friendId]
        );

        if (!friendship) {
            return res.json({ success: false, message: '不是好友关系' });
        }

        // 获取礼物配置
        const gift = INTIMACY_CONFIG.gifts.find(g => g.id === giftId);
        if (!gift) {
            return res.json({ success: false, message: '礼物不存在' });
        }

        // 检查用户余额
        const user = await db.queryOne('SELECT coins, diamonds FROM users WHERE user_id = ?', [req.userId]);
        if (gift.currency === 'coins' && user.coins < gift.price) {
            return res.json({ success: false, message: '金币不足' });
        }
        if (gift.currency === 'diamonds' && user.diamonds < gift.price) {
            return res.json({ success: false, message: '钻石不足' });
        }

        // 检查今日亲密度上限
        const today = new Date().toISOString().split('T')[0];
        await resetDailyCountsIfNeeded(req.userId, friendId, today);

        let dailyProgress = await db.queryOne(
            `SELECT intimacy_gained FROM intimacy_daily_progress
             WHERE user_id = ? AND friend_id = ? AND task_date = ?`,
            [req.userId, friendId, today]
        );

        const currentGained = dailyProgress?.intimacy_gained || 0;
        let actualIntimacy = Math.min(gift.intimacy, INTIMACY_CONFIG.dailyLimit - currentGained);
        if (actualIntimacy < 0) actualIntimacy = 0;

        // 扣除货币
        if (gift.currency === 'coins') {
            await db.update('UPDATE users SET coins = coins - ? WHERE user_id = ?', [gift.price, req.userId]);
        } else {
            await db.update('UPDATE users SET diamonds = diamonds - ? WHERE user_id = ?', [gift.price, req.userId]);
        }

        // 更新亲密度（双向）
        const oldIntimacy = friendship.intimacy || 0;
        const newIntimacy = oldIntimacy + actualIntimacy;
        const newLevel = getIntimacyLevel(newIntimacy).level;

        await db.update(
            `UPDATE friends SET
                intimacy = intimacy + ?,
                intimacy_level = ?,
                today_gift_count = today_gift_count + 1,
                total_gift_count = total_gift_count + 1,
                last_interact = NOW()
             WHERE user_id = ? AND friend_id = ?`,
            [actualIntimacy, newLevel, req.userId, friendId]
        );

        // 更新对方的亲密度（双向）
        await db.update(
            `UPDATE friends SET
                intimacy = intimacy + ?,
                intimacy_level = ?,
                last_interact = NOW()
             WHERE user_id = ? AND friend_id = ?`,
            [actualIntimacy, newLevel, friendId, req.userId]
        );

        // 更新每日进度
        await db.query(
            `INSERT INTO intimacy_daily_progress (user_id, friend_id, task_date, gift_done, intimacy_gained)
             VALUES (?, ?, ?, 1, ?)
             ON DUPLICATE KEY UPDATE gift_done = 1, intimacy_gained = intimacy_gained + ?`,
            [req.userId, friendId, today, actualIntimacy, actualIntimacy]
        );

        // 记录礼物
        await db.insert(
            `INSERT INTO friend_gift_records (sender_id, receiver_id, gift_type, gift_name, intimacy_value, message)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [req.userId, friendId, giftId, gift.name, actualIntimacy, message || '']
        );

        // 检查是否升级
        const levelUp = newLevel > (friendship.intimacy_level || 1);

        res.json({
            success: true,
            data: {
                giftName: gift.name,
                intimacyGained: actualIntimacy,
                newIntimacy,
                newLevel,
                levelUp,
                levelName: getIntimacyLevel(newIntimacy).name
            }
        });
    } catch (error) {
        console.error('送礼物错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 增加亲密度（聊天等行为触发）
router.post('/add', authMiddleware, async (req, res) => {
    try {
        const { friendId, action } = req.body;

        // 验证好友关系
        const friendship = await db.queryOne(
            'SELECT * FROM friends WHERE user_id = ? AND friend_id = ?',
            [req.userId, friendId]
        );

        if (!friendship) {
            return res.json({ success: false, message: '不是好友关系' });
        }

        const intimacyValue = INTIMACY_CONFIG.actions[action];
        if (!intimacyValue) {
            return res.json({ success: false, message: '无效的行为类型' });
        }

        // 检查今日亲密度上限
        const today = new Date().toISOString().split('T')[0];
        await resetDailyCountsIfNeeded(req.userId, friendId, today);

        let dailyProgress = await db.queryOne(
            `SELECT intimacy_gained FROM intimacy_daily_progress
             WHERE user_id = ? AND friend_id = ? AND task_date = ?`,
            [req.userId, friendId, today]
        );

        const currentGained = dailyProgress?.intimacy_gained || 0;
        let actualIntimacy = Math.min(intimacyValue, INTIMACY_CONFIG.dailyLimit - currentGained);
        if (actualIntimacy < 0) actualIntimacy = 0;

        if (actualIntimacy === 0) {
            return res.json({ success: true, data: { intimacyGained: 0, message: '今日亲密度已达上限' } });
        }

        // 更新亲密度
        const newIntimacy = (friendship.intimacy || 0) + actualIntimacy;
        const newLevel = getIntimacyLevel(newIntimacy).level;

        // 更新对应计数字段
        let countField = '';
        if (action === 'chat') countField = 'today_chat_count = today_chat_count + 1, total_chat_count = total_chat_count + 1';
        else if (action === 'help' || action === 'steal_forgive') countField = 'today_help_count = today_help_count + 1, total_help_count = total_help_count + 1';

        await db.update(
            `UPDATE friends SET
                intimacy = ?,
                intimacy_level = ?,
                ${countField ? countField + ',' : ''}
                last_interact = NOW()
             WHERE user_id = ? AND friend_id = ?`,
            [newIntimacy, newLevel, req.userId, friendId]
        );

        // 双向更新
        await db.update(
            `UPDATE friends SET
                intimacy = ?,
                intimacy_level = ?,
                last_interact = NOW()
             WHERE user_id = ? AND friend_id = ?`,
            [newIntimacy, newLevel, friendId, req.userId]
        );

        // 更新每日进度
        let taskField = action === 'chat' ? 'chat_done' : action === 'help' ? 'help_done' : 'visit_done';
        await db.query(
            `INSERT INTO intimacy_daily_progress (user_id, friend_id, task_date, ${taskField}, intimacy_gained)
             VALUES (?, ?, ?, 1, ?)
             ON DUPLICATE KEY UPDATE ${taskField} = 1, intimacy_gained = intimacy_gained + ?`,
            [req.userId, friendId, today, actualIntimacy, actualIntimacy]
        );

        // 检查是否升级
        const levelUp = newLevel > (friendship.intimacy_level || 1);

        res.json({
            success: true,
            data: {
                intimacyGained: actualIntimacy,
                newIntimacy,
                newLevel,
                levelUp,
                levelName: getIntimacyLevel(newIntimacy).name
            }
        });
    } catch (error) {
        console.error('增加亲密度错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 领取等级奖励
router.post('/claim-reward', authMiddleware, async (req, res) => {
    try {
        const { friendId, level } = req.body;

        // 验证好友关系和等级
        const friendship = await db.queryOne(
            'SELECT intimacy_level FROM friends WHERE user_id = ? AND friend_id = ?',
            [req.userId, friendId]
        );

        if (!friendship) {
            return res.json({ success: false, message: '不是好友关系' });
        }

        if (friendship.intimacy_level < level) {
            return res.json({ success: false, message: '未达到该等级' });
        }

        // 检查是否已领取
        const claimed = await db.queryOne(
            'SELECT id FROM intimacy_rewards WHERE user_id = ? AND friend_id = ? AND reward_level = ?',
            [req.userId, friendId, level]
        );

        if (claimed) {
            return res.json({ success: false, message: '已领取该等级奖励' });
        }

        const reward = INTIMACY_CONFIG.levelRewards[level];
        if (!reward) {
            return res.json({ success: false, message: '该等级无奖励' });
        }

        // 发放奖励
        await db.update(
            'UPDATE users SET coins = coins + ?, diamonds = diamonds + ? WHERE user_id = ?',
            [reward.coins, reward.diamonds, req.userId]
        );

        // 发放道具
        for (const item of reward.items) {
            await db.query(
                `INSERT INTO user_items (user_id, item_id, item_name, count, description)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE count = count + ?`,
                [req.userId, item.id, item.id, item.count, '', item.count]
            );
        }

        // 记录领取
        await db.insert(
            `INSERT INTO intimacy_rewards (user_id, friend_id, reward_level, reward_coins, reward_diamonds, reward_items)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [req.userId, friendId, level, reward.coins, reward.diamonds, JSON.stringify(reward.items)]
        );

        res.json({
            success: true,
            data: {
                coins: reward.coins,
                diamonds: reward.diamonds,
                items: reward.items
            }
        });
    } catch (error) {
        console.error('领取奖励错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取可领取的奖励列表
router.get('/claimable-rewards/:friendId', authMiddleware, async (req, res) => {
    try {
        const { friendId } = req.params;

        const friendship = await db.queryOne(
            'SELECT intimacy_level FROM friends WHERE user_id = ? AND friend_id = ?',
            [req.userId, friendId]
        );

        if (!friendship) {
            return res.json({ success: false, message: '不是好友关系' });
        }

        // 获取已领取的奖励
        const claimed = await db.query(
            'SELECT reward_level FROM intimacy_rewards WHERE user_id = ? AND friend_id = ?',
            [req.userId, friendId]
        );
        const claimedLevels = claimed.map(c => c.reward_level);

        // 找出可领取的奖励
        const claimable = [];
        for (let level = 2; level <= friendship.intimacy_level; level++) {
            if (!claimedLevels.includes(level) && INTIMACY_CONFIG.levelRewards[level]) {
                claimable.push({
                    level,
                    reward: INTIMACY_CONFIG.levelRewards[level]
                });
            }
        }

        res.json({ success: true, data: claimable });
    } catch (error) {
        console.error('获取可领取奖励错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取礼物列表
router.get('/gifts', authMiddleware, async (req, res) => {
    res.json({ success: true, data: INTIMACY_CONFIG.gifts });
});

// 获取收到的礼物记录
router.get('/received-gifts', authMiddleware, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;

        const gifts = await db.query(
            `SELECT g.*, u.nickname as senderNickname, u.avatar as senderAvatar
             FROM friend_gift_records g
             JOIN users u ON g.sender_id = u.user_id
             WHERE g.receiver_id = ?
             ORDER BY g.created_at DESC
             LIMIT ?`,
            [req.userId, limit]
        );

        // 标记为已读
        await db.update(
            'UPDATE friend_gift_records SET is_read = 1 WHERE receiver_id = ? AND is_read = 0',
            [req.userId]
        );

        res.json({ success: true, data: gifts });
    } catch (error) {
        console.error('获取礼物记录错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取未读礼物数量
router.get('/unread-gifts', authMiddleware, async (req, res) => {
    try {
        const result = await db.queryOne(
            'SELECT COUNT(*) as count FROM friend_gift_records WHERE receiver_id = ? AND is_read = 0',
            [req.userId]
        );

        res.json({ success: true, data: { count: result.count } });
    } catch (error) {
        console.error('获取未读礼物数错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 辅助函数：获取亲密度等级信息
function getIntimacyLevel(intimacy) {
    for (let level = 10; level >= 1; level--) {
        const config = INTIMACY_CONFIG.levels[level];
        if (intimacy >= config.min) {
            return { level, ...config };
        }
    }
    return { level: 1, ...INTIMACY_CONFIG.levels[1] };
}

// 辅助函数：重置每日计数
async function resetDailyCountsIfNeeded(userId, friendId, today) {
    const friendship = await db.queryOne(
        'SELECT reset_date FROM friends WHERE user_id = ? AND friend_id = ?',
        [userId, friendId]
    );

    if (!friendship.reset_date || friendship.reset_date !== today) {
        await db.update(
            `UPDATE friends SET
                today_chat_count = 0,
                today_gift_count = 0,
                today_help_count = 0,
                reset_date = ?
             WHERE user_id = ? AND friend_id = ?`,
            [today, userId, friendId]
        );
    }
}

module.exports = router;

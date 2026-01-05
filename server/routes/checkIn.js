/**
 * 签到路由
 */

const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// 签到奖励配置
const checkInRewards = [
    { day: 1, diamonds: 5, coins: 50, desc: '第1天' },
    { day: 2, diamonds: 10, coins: 100, desc: '第2天' },
    { day: 3, diamonds: 15, coins: 150, desc: '第3天' },
    { day: 4, diamonds: 20, coins: 200, desc: '第4天' },
    { day: 5, diamonds: 25, coins: 250, desc: '第5天' },
    { day: 6, diamonds: 30, coins: 300, desc: '第6天' },
    { day: 7, diamonds: 50, coins: 500, desc: '第7天' }
];

const consecutiveBonus = {
    7: { diamonds: 50, coins: 300, item: 'protection_shield', itemCount: 2 },
    14: { diamonds: 100, coins: 500, item: 'speed_up', itemCount: 3 },
    30: { diamonds: 200, coins: 1000, item: 'broadcast', itemCount: 5 }
};

// 获取签到状态
router.get('/status', authMiddleware, async (req, res) => {
    try {
        let checkIn = await db.queryOne('SELECT * FROM check_ins WHERE user_id = ?', [req.userId]);

        if (!checkIn) {
            res.json({ success: true, data: null });
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const canCheckIn = checkIn.last_check_in_date !== today;

        res.json({
            success: true,
            data: {
                lastCheckInDate: checkIn.last_check_in_date,
                consecutiveDays: checkIn.consecutive_days,
                totalCheckIns: checkIn.total_check_ins,
                canCheckIn
            }
        });
    } catch (error) {
        console.error('获取签到状态错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 执行签到
router.post('/do', authMiddleware, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        let checkIn = await db.queryOne('SELECT * FROM check_ins WHERE user_id = ?', [req.userId]);

        if (!checkIn) {
            // 初始化签到记录
            await db.insert(
                'INSERT INTO check_ins (user_id, last_check_in_date, consecutive_days, total_check_ins) VALUES (?, ?, 1, 1)',
                [req.userId, today]
            );
            checkIn = { consecutive_days: 1, total_check_ins: 1 };
        } else {
            if (checkIn.last_check_in_date === today) {
                return res.json({ success: false, message: '今天已经签到过了' });
            }

            // 更新连续天数
            let newConsecutive = 1;
            if (checkIn.last_check_in_date === yesterday) {
                newConsecutive = checkIn.consecutive_days + 1;
            }

            await db.update(
                'UPDATE check_ins SET last_check_in_date = ?, consecutive_days = ?, total_check_ins = total_check_ins + 1 WHERE user_id = ?',
                [today, newConsecutive, req.userId]
            );

            checkIn.consecutive_days = newConsecutive;
            checkIn.total_check_ins += 1;
        }

        // 计算奖励
        const dayIndex = Math.min(checkIn.consecutive_days - 1, checkInRewards.length - 1);
        const reward = checkInRewards[dayIndex];

        let bonusReward = null;
        if (consecutiveBonus[checkIn.consecutive_days]) {
            bonusReward = consecutiveBonus[checkIn.consecutive_days];
        }

        // 发放奖励
        let totalCoins = reward.coins;
        let totalDiamonds = reward.diamonds;

        if (bonusReward) {
            totalCoins += bonusReward.coins;
            totalDiamonds += bonusReward.diamonds;

            // 添加道具
            await db.query(
                `INSERT INTO user_items (user_id, item_id, item_name, count, description)
                 VALUES (?, ?, ?, ?, '')
                 ON DUPLICATE KEY UPDATE count = count + ?`,
                [req.userId, bonusReward.item, bonusReward.item, bonusReward.itemCount, bonusReward.itemCount]
            );
        }

        await db.update(
            'UPDATE users SET coins = coins + ?, diamonds = diamonds + ? WHERE user_id = ?',
            [totalCoins, totalDiamonds, req.userId]
        );

        const user = await db.queryOne('SELECT coins, diamonds FROM users WHERE user_id = ?', [req.userId]);

        res.json({
            success: true,
            data: {
                consecutiveDays: checkIn.consecutive_days,
                reward,
                bonus: bonusReward,
                newBalance: { coins: user.coins, diamonds: user.diamonds }
            }
        });
    } catch (error) {
        console.error('签到错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取签到奖励预览
router.get('/rewards', authMiddleware, (req, res) => {
    res.json({ success: true, data: checkInRewards });
});

module.exports = router;

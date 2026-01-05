/**
 * 成就路由
 */

const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// 成就配置
const achievements = {
    beginner: [
        { id: 'first_register', name: '初次见面', desc: '完成注册', reward: { diamonds: 10, coins: 100 }, type: '新手' },
        { id: 'first_harvest', name: '首次收取', desc: '收取第一批货物', reward: { diamonds: 5, coins: 50 }, type: '新手' },
        { id: 'first_steal', name: '初次截胡', desc: '第一次截胡好友货物', reward: { diamonds: 10, coins: 100 }, type: '新手' }
    ],
    growth: [
        { id: 'level_5', name: '物流新秀', desc: '等级达到5级', reward: { diamonds: 20, coins: 200 }, type: '成长' },
        { id: 'level_10', name: '站场经理', desc: '等级达到10级', reward: { diamonds: 50, coins: 500 }, type: '成长' },
        { id: 'level_20', name: '物流专家', desc: '等级达到20级', reward: { diamonds: 100, coins: 1000 }, type: '成长' },
        { id: 'steal_10', name: '新手小偷', desc: '累计截胡10次', reward: { diamonds: 15, coins: 150 }, type: '成长' },
        { id: 'steal_50', name: '截胡达人', desc: '累计截胡50次', reward: { diamonds: 40, coins: 400 }, type: '成长' },
        { id: 'steal_100', name: '截胡大师', desc: '累计截胡100次', reward: { diamonds: 80, coins: 800 }, type: '成长' }
    ],
    social: [
        { id: 'friend_5', name: '交友广阔', desc: '添加5个好友', reward: { diamonds: 20, coins: 200 }, type: '社交' },
        { id: 'chat_10', name: '聊天达人', desc: '发送10条聊天消息', reward: { diamonds: 10, coins: 100 }, type: '社交' },
        { id: 'branch_active', name: '分拨活跃', desc: '在分拨频道发言20次', reward: { diamonds: 25, coins: 250 }, type: '社交' }
    ],
    wealth: [
        { id: 'earn_10000', name: '万元户', desc: '累计获得10000金币', reward: { diamonds: 30, coins: 300 }, type: '财富' },
        { id: 'earn_50000', name: '金币大亨', desc: '累计获得50000金币', reward: { diamonds: 80, coins: 800 }, type: '财富' },
        { id: 'earn_100000', name: '物流富豪', desc: '累计获得100000金币', reward: { diamonds: 150, coins: 1500 }, type: '财富' }
    ]
};

const allAchievements = [...achievements.beginner, ...achievements.growth, ...achievements.social, ...achievements.wealth];

// 检查成就条件
async function checkAchievementCondition(achievementId, userId) {
    const user = await db.queryOne('SELECT * FROM users WHERE user_id = ?', [userId]);
    const chatStats = await db.queryOne('SELECT * FROM chat_stats WHERE user_id = ?', [userId]);
    const friendCount = await db.queryOne('SELECT COUNT(*) as count FROM friends WHERE user_id = ?', [userId]);
    const achievement = await db.queryOne('SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?', [userId, achievementId]);

    switch (achievementId) {
        case 'first_register':
            return achievement?.progress === 1;
        case 'first_harvest':
            return achievement?.progress === 1;
        case 'first_steal':
            return achievement?.progress === 1;
        case 'level_5':
            return user.level >= 5;
        case 'level_10':
            return user.level >= 10;
        case 'level_20':
            return user.level >= 20;
        case 'steal_10':
            return user.steal_count >= 10;
        case 'steal_50':
            return user.steal_count >= 50;
        case 'steal_100':
            return user.steal_count >= 100;
        case 'friend_5':
            return friendCount.count >= 5;
        case 'chat_10':
            return (chatStats?.total_count || 0) >= 10;
        case 'branch_active':
            return (chatStats?.branch_count || 0) >= 20;
        case 'earn_10000':
            return user.coins >= 10000;
        case 'earn_50000':
            return user.coins >= 50000;
        case 'earn_100000':
            return user.coins >= 100000;
        default:
            return false;
    }
}

// 获取所有成就
router.get('/all', authMiddleware, async (req, res) => {
    try {
        const userAchievements = await db.query(
            'SELECT achievement_id, claimed, progress FROM user_achievements WHERE user_id = ?',
            [req.userId]
        );

        const userMap = {};
        userAchievements.forEach(a => { userMap[a.achievement_id] = a; });

        const result = {};
        for (const [category, list] of Object.entries(achievements)) {
            result[category] = await Promise.all(list.map(async a => {
                const ua = userMap[a.id];
                const canClaim = await checkAchievementCondition(a.id, req.userId);
                return {
                    ...a,
                    claimed: ua?.claimed === 1,
                    progress: ua?.progress === 1,
                    canClaim: canClaim && ua?.claimed !== 1
                };
            }));
        }

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('获取成就错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 领取成就奖励
router.post('/claim', authMiddleware, async (req, res) => {
    try {
        const { achievementId } = req.body;

        const achievement = allAchievements.find(a => a.id === achievementId);
        if (!achievement) {
            return res.json({ success: false, message: '成就不存在' });
        }

        // 检查是否已领取
        const ua = await db.queryOne(
            'SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
            [req.userId, achievementId]
        );

        if (ua?.claimed === 1) {
            return res.json({ success: false, message: '该成就已领取' });
        }

        // 检查条件
        const canClaim = await checkAchievementCondition(achievementId, req.userId);
        if (!canClaim) {
            return res.json({ success: false, message: '未达成成就条件' });
        }

        // 发放奖励
        const reward = achievement.reward;
        await db.update(
            'UPDATE users SET coins = coins + ?, diamonds = diamonds + ? WHERE user_id = ?',
            [reward.coins || 0, reward.diamonds || 0, req.userId]
        );

        // 标记已领取
        await db.query(
            `INSERT INTO user_achievements (user_id, achievement_id, claimed, claimed_at)
             VALUES (?, ?, 1, NOW())
             ON DUPLICATE KEY UPDATE claimed = 1, claimed_at = NOW()`,
            [req.userId, achievementId]
        );

        const user = await db.queryOne('SELECT coins, diamonds FROM users WHERE user_id = ?', [req.userId]);

        res.json({
            success: true,
            data: {
                achievement,
                reward,
                newBalance: { coins: user.coins, diamonds: user.diamonds }
            }
        });
    } catch (error) {
        console.error('领取成就错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取可领取成就
router.get('/claimable', authMiddleware, async (req, res) => {
    try {
        const claimable = [];

        for (const a of allAchievements) {
            const ua = await db.queryOne(
                'SELECT claimed FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
                [req.userId, a.id]
            );

            if (ua?.claimed !== 1) {
                const canClaim = await checkAchievementCondition(a.id, req.userId);
                if (canClaim) {
                    claimable.push(a);
                }
            }
        }

        res.json({ success: true, data: claimable });
    } catch (error) {
        console.error('获取可领取成就错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

module.exports = router;

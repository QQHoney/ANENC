/**
 * 用户路由 - 用户信息管理
 */

const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// 配置
const CONFIG = {
    levelUpExpMultiplier: 100,
    levelUpCoinMultiplier: 50,
    initialSlots: 6,
    maxSlots: 12,
    slotsPerLevelMilestone: 5
};

// 获取用户信息
router.get('/info', authMiddleware, async (req, res) => {
    try {
        const user = await db.queryOne('SELECT * FROM users WHERE user_id = ?', [req.userId]);

        if (!user) {
            return res.json({ success: false, message: '用户不存在' });
        }

        const items = await db.query(
            'SELECT item_id as id, item_name as name, count, description as desc FROM user_items WHERE user_id = ?',
            [req.userId]
        );

        res.json({
            success: true,
            data: {
                userId: user.user_id,
                nickname: user.nickname,
                avatar: user.avatar,
                branchId: user.branch_id,
                branchName: user.branch_name,
                level: user.level,
                exp: user.exp,
                coins: user.coins,
                diamonds: user.diamonds,
                items,
                stationSlots: user.station_slots,
                stealCount: user.steal_count,
                status: user.status,
                createTime: new Date(user.created_at).getTime()
            }
        });
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 更新用户信息
router.post('/update', authMiddleware, async (req, res) => {
    try {
        const { nickname, avatar, status } = req.body;
        const updates = [];
        const params = [];

        if (nickname) {
            // 检查昵称是否被使用
            const existing = await db.queryOne(
                'SELECT id FROM users WHERE nickname = ? AND user_id != ?',
                [nickname, req.userId]
            );
            if (existing) {
                return res.json({ success: false, message: '该昵称已被使用' });
            }
            updates.push('nickname = ?');
            params.push(nickname);
        }

        if (avatar) {
            updates.push('avatar = ?');
            params.push(avatar);
        }

        if (status !== undefined) {
            updates.push('status = ?');
            params.push(status);
        }

        if (updates.length === 0) {
            return res.json({ success: false, message: '无更新内容' });
        }

        params.push(req.userId);
        await db.update(`UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`, params);

        // 更新排行榜
        if (nickname || avatar) {
            await db.update(
                'UPDATE rankings SET nickname = COALESCE(?, nickname), avatar = COALESCE(?, avatar) WHERE user_id = ?',
                [nickname || null, avatar || null, req.userId]
            );
        }

        const user = await db.queryOne('SELECT * FROM users WHERE user_id = ?', [req.userId]);
        res.json({ success: true, data: user });
    } catch (error) {
        console.error('更新用户信息错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 增加经验值
router.post('/addExp', authMiddleware, async (req, res) => {
    try {
        const { exp } = req.body;

        if (!exp || exp <= 0) {
            return res.json({ success: false, message: '无效的经验值' });
        }

        const user = await db.queryOne('SELECT * FROM users WHERE user_id = ?', [req.userId]);

        let newExp = user.exp + exp;
        let newLevel = user.level;
        let newCoins = user.coins;
        let newSlots = user.station_slots;

        // 检查升级
        let levelUpExp = newLevel * CONFIG.levelUpExpMultiplier;
        while (newExp >= levelUpExp) {
            newLevel += 1;
            newExp -= levelUpExp;
            newCoins += newLevel * CONFIG.levelUpCoinMultiplier;
            newSlots = Math.min(CONFIG.maxSlots, CONFIG.initialSlots + Math.floor(newLevel / CONFIG.slotsPerLevelMilestone));
            levelUpExp = newLevel * CONFIG.levelUpExpMultiplier;
        }

        await db.update(
            'UPDATE users SET exp = ?, level = ?, coins = ?, station_slots = ? WHERE user_id = ?',
            [newExp, newLevel, newCoins, newSlots, req.userId]
        );

        // 更新排行榜
        await db.update(
            'UPDATE rankings SET value = ? WHERE user_id = ? AND rank_type = ?',
            [newLevel, req.userId, 'level']
        );
        await db.update(
            'UPDATE rankings SET value = ? WHERE user_id = ? AND rank_type = ?',
            [newCoins, req.userId, 'coins']
        );

        res.json({
            success: true,
            data: {
                userId: req.userId,
                level: newLevel,
                exp: newExp,
                coins: newCoins,
                stationSlots: newSlots
            }
        });
    } catch (error) {
        console.error('增加经验值错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

module.exports = router;

/**
 * 站场路由 - 货物管理
 */

const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// 货物类型配置
const cargoTypes = [
    { id: 'small', name: '小件包裹', growTime: 60, baseValue: 10, exp: 5 },
    { id: 'medium', name: '中型货物', growTime: 180, baseValue: 30, exp: 15 },
    { id: 'large', name: '大件物品', growTime: 300, baseValue: 60, exp: 30 },
    { id: 'fragile', name: '易碎品', growTime: 240, baseValue: 80, exp: 40 },
    { id: 'express', name: '特快件', growTime: 30, baseValue: 50, exp: 25 },
    { id: 'cold', name: '冷链货物', growTime: 120, baseValue: 100, exp: 50 },
    { id: 'valuable', name: '贵重物品', growTime: 600, baseValue: 200, exp: 100 }
];

const stealRatio = 0.3;

function getCargoType(typeId) {
    return cargoTypes.find(c => c.id === typeId);
}

// 获取站场货物
router.get('/cargos', authMiddleware, async (req, res) => {
    try {
        const cargos = await db.query(
            `SELECT cargo_id as id, slot_index as slotIndex, type_id as typeId, type_name as typeName,
                    start_time as startTime, grow_time as growTime, value, exp, is_protected as isProtected, stolen
             FROM station_cargos WHERE user_id = ?`,
            [req.userId]
        );

        // 转换布尔值
        const result = cargos.map(c => ({
            ...c,
            isProtected: c.isProtected === 1,
            stolen: c.stolen === 1,
            status: c.isProtected ? 'protected' : 'growing',
            growTime: c.growTime * 1000
        }));

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('获取货物错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 放置货物
router.post('/place', authMiddleware, async (req, res) => {
    try {
        const { slotIndex, cargoTypeId } = req.body;
        const cargoType = getCargoType(cargoTypeId);

        if (!cargoType) {
            return res.json({ success: false, message: '货物类型不存在' });
        }

        // 检查货位是否占用
        const existing = await db.queryOne(
            'SELECT id FROM station_cargos WHERE user_id = ? AND slot_index = ?',
            [req.userId, slotIndex]
        );

        if (existing) {
            return res.json({ success: false, message: '该货位已被占用' });
        }

        const cargoId = 'cargo_' + Date.now();
        const startTime = Date.now();

        await db.insert(
            `INSERT INTO station_cargos (cargo_id, user_id, slot_index, type_id, type_name, start_time, grow_time, value, exp)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [cargoId, req.userId, slotIndex, cargoTypeId, cargoType.name, startTime, cargoType.growTime, cargoType.baseValue, cargoType.exp]
        );

        res.json({
            success: true,
            data: {
                id: cargoId,
                slotIndex,
                typeId: cargoTypeId,
                typeName: cargoType.name,
                startTime,
                growTime: cargoType.growTime * 1000,
                value: cargoType.baseValue,
                exp: cargoType.exp,
                status: 'growing',
                isProtected: false
            }
        });
    } catch (error) {
        console.error('放置货物错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 收取货物
router.post('/harvest', authMiddleware, async (req, res) => {
    try {
        const { cargoId } = req.body;

        const cargo = await db.queryOne(
            'SELECT * FROM station_cargos WHERE cargo_id = ? AND user_id = ?',
            [cargoId, req.userId]
        );

        if (!cargo) {
            return res.json({ success: false, message: '货物不存在' });
        }

        const now = Date.now();
        if (now - Number(cargo.start_time) < cargo.grow_time * 1000) {
            return res.json({ success: false, message: '货物还未准备好' });
        }

        // 删除货物
        await db.update('DELETE FROM station_cargos WHERE cargo_id = ?', [cargoId]);

        // 增加金币
        await db.update('UPDATE users SET coins = coins + ? WHERE user_id = ?', [cargo.value, req.userId]);

        // 更新排行榜
        const user = await db.queryOne('SELECT coins FROM users WHERE user_id = ?', [req.userId]);
        await db.update('UPDATE rankings SET value = ? WHERE user_id = ? AND rank_type = ?', [user.coins, req.userId, 'coins']);

        // 更新成就进度
        await db.query(
            `INSERT INTO user_achievements (user_id, achievement_id, progress)
             VALUES (?, 'first_harvest', 1)
             ON DUPLICATE KEY UPDATE progress = 1`,
            [req.userId]
        );

        res.json({
            success: true,
            data: {
                coins: cargo.value,
                exp: cargo.exp
            }
        });
    } catch (error) {
        console.error('收取货物错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 使用防护盾
router.post('/protect', authMiddleware, async (req, res) => {
    try {
        const { cargoId } = req.body;

        const cargo = await db.queryOne(
            'SELECT * FROM station_cargos WHERE cargo_id = ? AND user_id = ?',
            [cargoId, req.userId]
        );

        if (!cargo) {
            return res.json({ success: false, message: '货物不存在' });
        }

        // 检查道具
        const item = await db.queryOne(
            'SELECT count FROM user_items WHERE user_id = ? AND item_id = ?',
            [req.userId, 'protection_shield']
        );

        if (!item || item.count <= 0) {
            return res.json({ success: false, message: '防护盾数量不足' });
        }

        // 消耗道具
        await db.update(
            'UPDATE user_items SET count = count - 1 WHERE user_id = ? AND item_id = ?',
            [req.userId, 'protection_shield']
        );

        // 更新货物状态
        await db.update('UPDATE station_cargos SET is_protected = 1 WHERE cargo_id = ?', [cargoId]);

        res.json({ success: true, data: { id: cargoId, isProtected: true, status: 'protected' } });
    } catch (error) {
        console.error('使用防护盾错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 使用加速卡
router.post('/speedup', authMiddleware, async (req, res) => {
    try {
        const { cargoId } = req.body;

        const cargo = await db.queryOne(
            'SELECT * FROM station_cargos WHERE cargo_id = ? AND user_id = ?',
            [cargoId, req.userId]
        );

        if (!cargo) {
            return res.json({ success: false, message: '货物不存在' });
        }

        // 检查道具
        const item = await db.queryOne(
            'SELECT count FROM user_items WHERE user_id = ? AND item_id = ?',
            [req.userId, 'speed_up']
        );

        if (!item || item.count <= 0) {
            return res.json({ success: false, message: '加速卡数量不足' });
        }

        // 消耗道具并减少一半时间
        await db.update(
            'UPDATE user_items SET count = count - 1 WHERE user_id = ? AND item_id = ?',
            [req.userId, 'speed_up']
        );

        const newStartTime = Number(cargo.start_time) - (cargo.grow_time * 1000 / 2);
        await db.update('UPDATE station_cargos SET start_time = ? WHERE cargo_id = ?', [newStartTime, cargoId]);

        res.json({ success: true, data: { id: cargoId, startTime: newStartTime } });
    } catch (error) {
        console.error('使用加速卡错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 截胡货物
router.post('/steal', authMiddleware, async (req, res) => {
    try {
        const { targetUserId, cargoId } = req.body;

        if (targetUserId === req.userId) {
            return res.json({ success: false, message: '不能截胡自己的货物' });
        }

        const cargo = await db.queryOne(
            'SELECT * FROM station_cargos WHERE cargo_id = ? AND user_id = ?',
            [cargoId, targetUserId]
        );

        if (!cargo) {
            return res.json({ success: false, message: '货物不存在' });
        }

        if (cargo.is_protected) {
            return res.json({ success: false, message: '该货物受防护盾保护，无法截胡' });
        }

        const now = Date.now();
        if (now - Number(cargo.start_time) < cargo.grow_time * 1000) {
            return res.json({ success: false, message: '货物还未成熟，无法截胡' });
        }

        // 计算截胡收益
        const stolenValue = Math.floor(cargo.value * stealRatio);
        const remainingValue = cargo.value - stolenValue;

        // 更新货物价值
        await db.update(
            'UPDATE station_cargos SET value = ?, stolen = 1 WHERE cargo_id = ?',
            [remainingValue, cargoId]
        );

        // 增加自己的金币和截胡次数
        await db.update(
            'UPDATE users SET coins = coins + ?, steal_count = steal_count + 1 WHERE user_id = ?',
            [stolenValue, req.userId]
        );

        // 更新排行榜
        const user = await db.queryOne('SELECT coins, steal_count FROM users WHERE user_id = ?', [req.userId]);
        await db.update('UPDATE rankings SET value = ? WHERE user_id = ? AND rank_type = ?', [user.coins, req.userId, 'coins']);
        await db.update('UPDATE rankings SET value = ? WHERE user_id = ? AND rank_type = ?', [user.steal_count, req.userId, 'steal']);

        // 更新成就进度
        await db.query(
            `INSERT INTO user_achievements (user_id, achievement_id, progress)
             VALUES (?, 'first_steal', 1)
             ON DUPLICATE KEY UPDATE progress = 1`,
            [req.userId]
        );

        res.json({
            success: true,
            data: {
                stolenValue,
                message: `成功截胡，获得 ${stolenValue} 金币！`
            }
        });
    } catch (error) {
        console.error('截胡货物错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取好友站场货物（用于截胡）
router.get('/friend/:targetUserId', authMiddleware, async (req, res) => {
    try {
        const { targetUserId } = req.params;

        const cargos = await db.query(
            `SELECT cargo_id as id, slot_index as slotIndex, type_id as typeId, type_name as typeName,
                    start_time as startTime, grow_time as growTime, value, exp, is_protected as isProtected, stolen
             FROM station_cargos WHERE user_id = ?`,
            [targetUserId]
        );

        const result = cargos.map(c => ({
            ...c,
            isProtected: c.isProtected === 1,
            stolen: c.stolen === 1,
            status: c.isProtected ? 'protected' : 'growing',
            growTime: c.growTime * 1000
        }));

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('获取好友货物错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

module.exports = router;

/**
 * 商城路由 - 商品购买
 */

const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// 商品配置
const shopItems = [
    { id: 'protection_shield', name: '防护盾', price: 50, currency: 'coins', desc: '保护货物不被截胡', category: 'props' },
    { id: 'speed_up', name: '加速卡', price: 80, currency: 'coins', desc: '货物处理时间减半', category: 'props' },
    { id: 'broadcast', name: '广播喇叭', price: 20, currency: 'coins', desc: '世界聊天使用', category: 'props' },
    { id: 'steal_card', name: '截胡卡', price: 100, currency: 'coins', desc: '提高截胡成功率50%', category: 'props' },
    { id: 'fertilizer', name: '高效肥料', price: 30, currency: 'coins', desc: '货物价值提升20%', category: 'props' },
    { id: 'slot_expand', name: '货位扩展', price: 500, currency: 'diamonds', desc: '永久增加1个货位', category: 'special' },
    { id: 'vip_card', name: 'VIP周卡', price: 200, currency: 'diamonds', desc: '7天收益提升50%', category: 'special' },
    { id: 'rename_card', name: '改名卡', price: 500, currency: 'diamonds', desc: '修改一次昵称', category: 'special' },
    { id: 'transfer_card', name: '转区卡', price: 1000, currency: 'diamonds', desc: '更换所属分拨中心', category: 'special' }
];

// 获取商品列表
router.get('/items', authMiddleware, async (req, res) => {
    try {
        const { category } = req.query;
        let items = shopItems;

        if (category) {
            items = items.filter(i => i.category === category);
        }

        res.json({ success: true, data: items });
    } catch (error) {
        console.error('获取商品列表错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 购买商品
router.post('/buy', authMiddleware, async (req, res) => {
    try {
        const { itemId, count = 1 } = req.body;

        const shopItem = shopItems.find(i => i.id === itemId);
        if (!shopItem) {
            return res.json({ success: false, message: '商品不存在' });
        }

        const user = await db.queryOne('SELECT * FROM users WHERE user_id = ?', [req.userId]);
        const totalPrice = shopItem.price * count;

        // 检查货币
        if (shopItem.currency === 'coins' && user.coins < totalPrice) {
            return res.json({ success: false, message: '金币不足' });
        }
        if (shopItem.currency === 'diamonds' && user.diamonds < totalPrice) {
            return res.json({ success: false, message: '钻石不足' });
        }

        // 扣除货币
        if (shopItem.currency === 'coins') {
            await db.update('UPDATE users SET coins = coins - ? WHERE user_id = ?', [totalPrice, req.userId]);
        } else {
            await db.update('UPDATE users SET diamonds = diamonds - ? WHERE user_id = ?', [totalPrice, req.userId]);
        }

        // 增加道具
        await db.query(
            `INSERT INTO user_items (user_id, item_id, item_name, count, description)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE count = count + ?`,
            [req.userId, itemId, shopItem.name, count, shopItem.desc, count]
        );

        // 获取更新后的用户信息
        const newUser = await db.queryOne('SELECT coins, diamonds FROM users WHERE user_id = ?', [req.userId]);
        const items = await db.query(
            'SELECT item_id as id, item_name as name, count, description as desc FROM user_items WHERE user_id = ?',
            [req.userId]
        );

        // 更新排行榜
        await db.update('UPDATE rankings SET value = ? WHERE user_id = ? AND rank_type = ?', [newUser.coins, req.userId, 'coins']);

        res.json({
            success: true,
            data: {
                coins: newUser.coins,
                diamonds: newUser.diamonds,
                items
            }
        });
    } catch (error) {
        console.error('购买商品错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

module.exports = router;

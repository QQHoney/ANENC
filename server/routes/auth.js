/**
 * 认证路由 - 注册和登录
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

// 游戏配置
const CONFIG = {
    branches: [
        { id: 'langfang', name: '廊坊分拨', region: '华北' },
        { id: 'guangzhou', name: '广州分拨', region: '华南' },
        { id: 'wuhan', name: '武汉分拨', region: '华中' },
        { id: 'shanghai', name: '上海分拨', region: '华东' },
        { id: 'chengdu', name: '成都分拨', region: '西南' },
        { id: 'xian', name: '西安分拨', region: '西北' },
        { id: 'shenyang', name: '沈阳分拨', region: '东北' },
        { id: 'nanjing', name: '南京分拨', region: '华东' }
    ],
    newUserGifts: {
        coins: 1000,
        diamonds: 50,
        items: [
            { id: 'protection_shield', name: '防护盾', count: 5, desc: '保护货物不被截胡' },
            { id: 'speed_up', name: '加速卡', count: 3, desc: '货物处理时间减半' },
            { id: 'broadcast', name: '广播喇叭', count: 10, desc: '世界聊天使用' },
            { id: 'steal_card', name: '截胡卡', count: 2, desc: '提高截胡成功率' }
        ]
    }
};

// 注册
router.post('/register', async (req, res) => {
    try {
        const { nickname, password, branchId } = req.body;

        if (!nickname || !password || !branchId) {
            return res.json({ success: false, message: '请填写完整信息' });
        }

        if (nickname.length < 2 || nickname.length > 20) {
            return res.json({ success: false, message: '昵称长度2-20字符' });
        }

        if (password.length < 6) {
            return res.json({ success: false, message: '密码至少6位' });
        }

        // 检查昵称是否存在
        const existing = await db.queryOne('SELECT id FROM users WHERE nickname = ?', [nickname]);
        if (existing) {
            return res.json({ success: false, message: '该昵称已被使用' });
        }

        const branch = CONFIG.branches.find(b => b.id === branchId);
        if (!branch) {
            return res.json({ success: false, message: '无效的分拨' });
        }

        const userId = 'user_' + Date.now();
        const passwordHash = await bcrypt.hash(password, 10);
        const gifts = CONFIG.newUserGifts;

        // 创建用户
        await db.insert(
            `INSERT INTO users (user_id, nickname, password_hash, branch_id, branch_name, coins, diamonds, last_login)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [userId, nickname, passwordHash, branchId, branch.name, gifts.coins, gifts.diamonds]
        );

        // 添加新手道具
        for (const item of gifts.items) {
            await db.insert(
                `INSERT INTO user_items (user_id, item_id, item_name, count, description)
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, item.id, item.name, item.count, item.desc]
            );
        }

        // 初始化成就
        await db.insert(
            `INSERT INTO user_achievements (user_id, achievement_id, progress)
             VALUES (?, 'first_register', 1)`,
            [userId]
        );

        // 初始化排行榜数据
        await db.insert(
            `INSERT INTO rankings (user_id, rank_type, value, nickname, avatar, branch_id, branch_name)
             VALUES (?, 'coins', ?, ?, ?, ?, ?),
                    (?, 'level', 1, ?, ?, ?, ?),
                    (?, 'steal', 0, ?, ?, ?, ?)`,
            [userId, gifts.coins, nickname, 'assets/default-avatar.svg', branchId, branch.name,
             userId, nickname, 'assets/default-avatar.svg', branchId, branch.name,
             userId, nickname, 'assets/default-avatar.svg', branchId, branch.name]
        );

        // 生成 JWT
        const token = jwt.sign(
            { userId, nickname, branchId },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // 获取道具列表
        const items = await db.query('SELECT item_id as id, item_name as name, count, description as `desc` FROM user_items WHERE user_id = ?', [userId]);

        res.json({
            success: true,
            data: {
                token,
                userInfo: {
                    userId,
                    nickname,
                    avatar: 'assets/default-avatar.svg',
                    branchId,
                    branchName: branch.name,
                    level: 1,
                    exp: 0,
                    coins: gifts.coins,
                    diamonds: gifts.diamonds,
                    items,
                    stationSlots: 6,
                    stealCount: 0,
                    createTime: Date.now()
                }
            }
        });
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 登录
router.post('/login', async (req, res) => {
    try {
        const { nickname, password } = req.body;

        if (!nickname || !password) {
            return res.json({ success: false, message: '请填写昵称和密码' });
        }

        const user = await db.queryOne('SELECT * FROM users WHERE nickname = ?', [nickname]);

        if (!user) {
            return res.json({ success: false, message: '用户不存在' });
        }

        if (user.is_banned) {
            return res.json({ success: false, message: '账号已被封禁' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.json({ success: false, message: '密码错误' });
        }

        // 更新最后登录时间
        await db.update('UPDATE users SET last_login = NOW() WHERE user_id = ?', [user.user_id]);

        // 生成 JWT
        const token = jwt.sign(
            { userId: user.user_id, nickname: user.nickname, branchId: user.branch_id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // 获取道具列表
        const items = await db.query(
            'SELECT item_id as id, item_name as name, count, description as `desc` FROM user_items WHERE user_id = ?',
            [user.user_id]
        );

        res.json({
            success: true,
            data: {
                token,
                userInfo: {
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
                    createTime: new Date(user.created_at).getTime()
                }
            }
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取分拨列表
router.get('/branches', (req, res) => {
    res.json({ success: true, data: CONFIG.branches });
});

module.exports = router;

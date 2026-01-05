/**
 * 好友路由 - 好友和分拨成员管理
 */

const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// 获取好友列表
router.get('/list', authMiddleware, async (req, res) => {
    try {
        const friends = await db.query(
            `SELECT u.user_id as userId, u.nickname, u.avatar, u.level, u.branch_id as branchId, u.branch_name as branchName,
                    f.created_at as addTime
             FROM friends f
             JOIN users u ON f.friend_id = u.user_id
             WHERE f.user_id = ?`,
            [req.userId]
        );

        res.json({ success: true, data: friends });
    } catch (error) {
        console.error('获取好友列表错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 添加好友
router.post('/add', authMiddleware, async (req, res) => {
    try {
        const { targetUserId } = req.body;

        if (targetUserId === req.userId) {
            return res.json({ success: false, message: '不能添加自己为好友' });
        }

        // 检查用户是否存在
        const targetUser = await db.queryOne('SELECT user_id FROM users WHERE user_id = ?', [targetUserId]);
        if (!targetUser) {
            return res.json({ success: false, message: '用户不存在' });
        }

        // 检查是否已是好友
        const existing = await db.queryOne(
            'SELECT id FROM friends WHERE user_id = ? AND friend_id = ?',
            [req.userId, targetUserId]
        );

        if (existing) {
            return res.json({ success: false, message: '已经是好友了' });
        }

        // 双向添加
        await db.insert(
            'INSERT INTO friends (user_id, friend_id) VALUES (?, ?)',
            [req.userId, targetUserId]
        );
        await db.insert(
            'INSERT IGNORE INTO friends (user_id, friend_id) VALUES (?, ?)',
            [targetUserId, req.userId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('添加好友错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 删除好友
router.post('/remove', authMiddleware, async (req, res) => {
    try {
        const { targetUserId } = req.body;

        await db.update(
            'DELETE FROM friends WHERE user_id = ? AND friend_id = ?',
            [req.userId, targetUserId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('删除好友错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取分拨成员列表
router.get('/branch/:branchId', authMiddleware, async (req, res) => {
    try {
        const { branchId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const offset = (page - 1) * pageSize;

        const members = await db.query(
            `SELECT user_id as userId, nickname, avatar, level, branch_id as branchId, branch_name as branchName
             FROM users WHERE branch_id = ?
             ORDER BY level DESC
             LIMIT ? OFFSET ?`,
            [branchId, pageSize, offset]
        );

        const countResult = await db.queryOne(
            'SELECT COUNT(*) as total FROM users WHERE branch_id = ?',
            [branchId]
        );

        res.json({
            success: true,
            data: {
                list: members,
                total: countResult.total
            }
        });
    } catch (error) {
        console.error('获取分拨成员错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 搜索用户
router.get('/search', authMiddleware, async (req, res) => {
    try {
        const { keyword } = req.query;

        if (!keyword || keyword.length < 2) {
            return res.json({ success: false, message: '关键词至少2个字符' });
        }

        const users = await db.query(
            `SELECT user_id as userId, nickname, avatar, level, branch_id as branchId, branch_name as branchName
             FROM users WHERE nickname LIKE ? AND user_id != ?
             LIMIT 20`,
            [`%${keyword}%`, req.userId]
        );

        res.json({ success: true, data: users });
    } catch (error) {
        console.error('搜索用户错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

module.exports = router;

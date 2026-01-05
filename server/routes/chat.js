/**
 * 聊天路由 - 聊天消息管理
 */

const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// 获取分拨聊天记录
router.get('/branch/:branchId', authMiddleware, async (req, res) => {
    try {
        const { branchId } = req.params;
        const limit = parseInt(req.query.limit) || 50;

        const messages = await db.query(
            `SELECT message_id as id, branch_id as branchId, user_id as userId, nickname, avatar, content,
                    UNIX_TIMESTAMP(created_at) * 1000 as timestamp, 'branch' as type
             FROM branch_messages
             WHERE branch_id = ?
             ORDER BY created_at DESC
             LIMIT ${limit}`,
            [branchId]
        );

        res.json({ success: true, data: messages.reverse() });
    } catch (error) {
        console.error('获取分拨聊天记录错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取世界聊天记录
router.get('/world', authMiddleware, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;

        const messages = await db.query(
            `SELECT message_id as id, user_id as userId, nickname, avatar, branch_id as branchId, branch_name as branchName,
                    content, UNIX_TIMESTAMP(created_at) * 1000 as timestamp, 'world' as type
             FROM world_messages
             ORDER BY created_at DESC
             LIMIT ${limit}`,
            []
        );

        res.json({ success: true, data: messages.reverse() });
    } catch (error) {
        console.error('获取世界聊天记录错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取私聊记录
router.get('/private/:targetUserId', authMiddleware, async (req, res) => {
    try {
        const { targetUserId } = req.params;
        const limit = parseInt(req.query.limit) || 50;

        const messages = await db.query(
            `SELECT message_id as id, sender_id as senderId, receiver_id as receiverId,
                    sender_nickname as senderNickname, sender_avatar as senderAvatar,
                    content, message_type as messageType, is_read as 'read',
                    UNIX_TIMESTAMP(created_at) * 1000 as timestamp
             FROM private_messages
             WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
             ORDER BY created_at DESC
             LIMIT ${limit}`,
            [req.userId, targetUserId, targetUserId, req.userId]
        );

        res.json({ success: true, data: messages.reverse() });
    } catch (error) {
        console.error('获取私聊记录错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取会话列表
router.get('/conversations', authMiddleware, async (req, res) => {
    try {
        const conversations = await db.query(
            `SELECT target_user_id as targetUserId, target_nickname as targetNickname, target_avatar as targetAvatar,
                    last_message as lastMessage, last_message_type as lastMessageType,
                    last_message_time as lastMessageTime, unread_count as unreadCount
             FROM conversations
             WHERE user_id = ?
             ORDER BY last_message_time DESC`,
            [req.userId]
        );

        res.json({ success: true, data: conversations });
    } catch (error) {
        console.error('获取会话列表错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 标记会话已读
router.post('/read/:targetUserId', authMiddleware, async (req, res) => {
    try {
        const { targetUserId } = req.params;

        // 更新会话未读数
        await db.update(
            'UPDATE conversations SET unread_count = 0 WHERE user_id = ? AND target_user_id = ?',
            [req.userId, targetUserId]
        );

        // 标记消息已读
        await db.update(
            'UPDATE private_messages SET is_read = 1 WHERE receiver_id = ? AND sender_id = ?',
            [req.userId, targetUserId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('标记已读错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取未读消息数
router.get('/unread', authMiddleware, async (req, res) => {
    try {
        const result = await db.queryOne(
            'SELECT SUM(unread_count) as total FROM conversations WHERE user_id = ?',
            [req.userId]
        );

        const details = await db.query(
            'SELECT target_user_id as userId, unread_count as count FROM conversations WHERE user_id = ? AND unread_count > 0',
            [req.userId]
        );

        const detailsMap = {};
        details.forEach(d => { detailsMap[d.userId] = d.count; });

        res.json({ success: true, data: { total: result.total || 0, details: detailsMap } });
    } catch (error) {
        console.error('获取未读数错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 删除会话
router.delete('/conversation/:targetUserId', authMiddleware, async (req, res) => {
    try {
        const { targetUserId } = req.params;

        await db.update(
            'DELETE FROM conversations WHERE user_id = ? AND target_user_id = ?',
            [req.userId, targetUserId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('删除会话错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取用户在线状态
router.post('/online-status', authMiddleware, async (req, res) => {
    try {
        const { userIds } = req.body;

        if (!userIds || !Array.isArray(userIds)) {
            return res.json({ success: false, message: '参数错误' });
        }

        const placeholders = userIds.map(() => '?').join(',');
        const statuses = await db.query(
            `SELECT user_id, is_online as online, UNIX_TIMESTAMP(last_seen) * 1000 as lastSeen
             FROM online_status WHERE user_id IN (${placeholders})`,
            userIds
        );

        const result = {};
        userIds.forEach(id => {
            const status = statuses.find(s => s.user_id === id);
            result[id] = status ? { online: status.online === 1, lastSeen: status.lastSeen } : { online: false, lastSeen: null };
        });

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('获取在线状态错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

module.exports = router;

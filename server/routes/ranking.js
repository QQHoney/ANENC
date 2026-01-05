/**
 * 排行榜路由
 */

const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// 获取排行榜
router.get('/:type', authMiddleware, async (req, res) => {
    try {
        const { type } = req.params;
        const { branchId, limit = 100 } = req.query;

        if (!['coins', 'level', 'steal'].includes(type)) {
            return res.json({ success: false, message: '无效的排行榜类型' });
        }

        let sql = `SELECT user_id as userId, nickname, avatar, branch_id as branchId, branch_name as branchName, value
                   FROM rankings WHERE rank_type = ?`;
        const params = [type];

        if (branchId) {
            sql += ' AND branch_id = ?';
            params.push(branchId);
        }

        sql += ' ORDER BY value DESC LIMIT ?';
        params.push(parseInt(limit));

        const rankings = await db.query(sql, params);

        res.json({ success: true, data: rankings });
    } catch (error) {
        console.error('获取排行榜错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取用户排名
router.get('/:type/my', authMiddleware, async (req, res) => {
    try {
        const { type } = req.params;

        if (!['coins', 'level', 'steal'].includes(type)) {
            return res.json({ success: false, message: '无效的排行榜类型' });
        }

        const myRank = await db.queryOne(
            'SELECT value FROM rankings WHERE user_id = ? AND rank_type = ?',
            [req.userId, type]
        );

        if (!myRank) {
            return res.json({ success: true, data: { rank: -1 } });
        }

        // 计算排名
        const result = await db.queryOne(
            'SELECT COUNT(*) + 1 as rank FROM rankings WHERE rank_type = ? AND value > ?',
            [type, myRank.value]
        );

        res.json({ success: true, data: { rank: result.rank, value: myRank.value } });
    } catch (error) {
        console.error('获取用户排名错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

module.exports = router;

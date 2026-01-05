/**
 * 任务路由
 */

const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// 任务配置
const tasks = {
    daily: [
        { id: 'daily_harvest_5', name: '勤劳致富', desc: '收取5次货物', target: 5, reward: { diamonds: 5, coins: 100 }, type: 'daily' },
        { id: 'daily_steal_3', name: '截胡高手', desc: '截胡3次好友货物', target: 3, reward: { diamonds: 8, coins: 150 }, type: 'daily' },
        { id: 'daily_chat_5', name: '社交达人', desc: '发送5条聊天消息', target: 5, reward: { diamonds: 5, coins: 50 }, type: 'daily' }
    ],
    weekly: [
        { id: 'weekly_level_2', name: '等级提升', desc: '本周等级提升2级', target: 2, reward: { diamonds: 25, coins: 300 }, type: 'weekly' },
        { id: 'weekly_steal_20', name: '截胡狂人', desc: '本周累计截胡20次', target: 20, reward: { diamonds: 30, coins: 400 }, type: 'weekly' },
        { id: 'weekly_harvest_50', name: '收货专家', desc: '本周累计收取50次货物', target: 50, reward: { diamonds: 25, coins: 350 }, type: 'weekly' }
    ],
    challenge: [
        { id: 'challenge_login_7', name: '坚持就是胜利', desc: '连续登录7天', target: 7, reward: { diamonds: 50, coins: 500 }, type: 'challenge' },
        { id: 'challenge_items_100', name: '道具收藏家', desc: '拥有100个道具', target: 100, reward: { diamonds: 40, coins: 400 }, type: 'challenge' },
        { id: 'challenge_slots_12', name: '站场扩建', desc: '解锁全部12个货位', target: 12, reward: { diamonds: 60, coins: 600 }, type: 'challenge' }
    ]
};

// 获取周数
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// 获取所有任务
router.get('/all', authMiddleware, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const currentWeek = getWeekNumber(new Date());

        // 获取用户任务进度
        const taskProgress = await db.query(
            'SELECT * FROM task_progress WHERE user_id = ?',
            [req.userId]
        );

        const progressMap = {};
        taskProgress.forEach(t => {
            progressMap[`${t.task_type}_${t.task_id}`] = t;
        });

        const result = {};
        for (const [type, list] of Object.entries(tasks)) {
            result[type] = list.map(task => {
                const key = `${type}_${task.id}`;
                const tp = progressMap[key];

                // 检查是否需要重置
                let progress = tp?.progress || 0;
                let claimed = tp?.claimed === 1;

                if (type === 'daily' && tp?.reset_date !== today) {
                    progress = 0;
                    claimed = false;
                }
                if (type === 'weekly' && tp?.reset_date && getWeekNumber(new Date(tp.reset_date)) !== currentWeek) {
                    progress = 0;
                    claimed = false;
                }

                return {
                    ...task,
                    progress,
                    completed: progress >= task.target,
                    claimed
                };
            });
        }

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('获取任务错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 更新任务进度
router.post('/progress', authMiddleware, async (req, res) => {
    try {
        const { taskType, taskId, increment = 1 } = req.body;
        const today = new Date().toISOString().split('T')[0];

        await db.query(
            `INSERT INTO task_progress (user_id, task_type, task_id, progress, reset_date)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE progress = progress + ?, reset_date = ?`,
            [req.userId, taskType, taskId, increment, today, increment, today]
        );

        const tp = await db.queryOne(
            'SELECT progress FROM task_progress WHERE user_id = ? AND task_type = ? AND task_id = ?',
            [req.userId, taskType, taskId]
        );

        res.json({ success: true, data: tp?.progress || increment });
    } catch (error) {
        console.error('更新任务进度错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 领取任务奖励
router.post('/claim', authMiddleware, async (req, res) => {
    try {
        const { taskType, taskId } = req.body;

        const taskList = tasks[taskType];
        const task = taskList?.find(t => t.id === taskId);

        if (!task) {
            return res.json({ success: false, message: '任务不存在' });
        }

        const tp = await db.queryOne(
            'SELECT * FROM task_progress WHERE user_id = ? AND task_type = ? AND task_id = ?',
            [req.userId, taskType, taskId]
        );

        if (tp?.claimed === 1) {
            return res.json({ success: false, message: '奖励已领取' });
        }

        if (!tp || tp.progress < task.target) {
            return res.json({ success: false, message: '任务未完成' });
        }

        // 发放奖励
        await db.update(
            'UPDATE users SET coins = coins + ?, diamonds = diamonds + ? WHERE user_id = ?',
            [task.reward.coins || 0, task.reward.diamonds || 0, req.userId]
        );

        // 标记已领取
        await db.update(
            'UPDATE task_progress SET claimed = 1 WHERE user_id = ? AND task_type = ? AND task_id = ?',
            [req.userId, taskType, taskId]
        );

        const user = await db.queryOne('SELECT coins, diamonds FROM users WHERE user_id = ?', [req.userId]);

        res.json({
            success: true,
            data: {
                task,
                reward: task.reward,
                newBalance: { coins: user.coins, diamonds: user.diamonds }
            }
        });
    } catch (error) {
        console.error('领取任务奖励错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

module.exports = router;

/**
 * 安能物流农场游戏 - 主服务入口
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');

const db = require('./db');
const { setupWebSocket } = require('./websocket');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const stationRoutes = require('./routes/station');
const friendRoutes = require('./routes/friend');
const chatRoutes = require('./routes/chat');
const shopRoutes = require('./routes/shop');
const rankingRoutes = require('./routes/ranking');
const achievementRoutes = require('./routes/achievement');
const checkInRoutes = require('./routes/checkIn');
const taskRoutes = require('./routes/task');
const intimacyRoutes = require('./routes/intimacy');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 设置安全响应头
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});

// 静态文件服务（前端文件）- 包含正确的 MIME 类型设置
app.use(express.static(path.join(__dirname, '../'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
        } else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
        } else if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        } else if (filePath.endsWith('.svg')) {
            res.setHeader('Content-Type', 'image/svg+xml');
        } else if (filePath.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
        } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
            res.setHeader('Content-Type', 'image/jpeg');
        } else if (filePath.endsWith('.gif')) {
            res.setHeader('Content-Type', 'image/gif');
        } else if (filePath.endsWith('.webp')) {
            res.setHeader('Content-Type', 'image/webp');
        } else if (filePath.endsWith('.ico')) {
            res.setHeader('Content-Type', 'image/x-icon');
        } else if (filePath.endsWith('.json')) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
        }
    }
}));

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/station', stationRoutes);
app.use('/api/friend', friendRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/achievement', achievementRoutes);
app.use('/api/checkIn', checkInRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/intimacy', intimacyRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// 404 处理
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ success: false, message: '接口不存在' });
    } else {
        res.sendFile(path.join(__dirname, '../index.html'));
    }
});

// 错误处理
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
});

// 启动服务
async function start() {
    const dbConnected = await db.testConnection();
    if (!dbConnected) {
        console.error('无法连接数据库，服务启动失败');
        process.exit(1);
    }

    // 设置 WebSocket
    setupWebSocket(server);

    server.listen(PORT, () => {
        console.log(`服务器运行在端口 ${PORT}`);
        console.log(`WebSocket 服务已启动`);
    });
}

start();

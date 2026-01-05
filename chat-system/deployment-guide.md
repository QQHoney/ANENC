# Serv00聊天系统部署指南

## 阶段1：环境准备

### 1.1 登录Serv00并创建项目结构
```bash
# SSH登录
ssh your_username@serv00.com

# 创建项目目录
mkdir -p ~/domains/chat.yourdomain.com/public_html
cd ~/domains/chat.yourdomain.com

# 创建Node.js应用目录
mkdir app
mkdir logs
mkdir data
mkdir backups
```

### 1.2 初始化Node.js项目
```bash
cd app
npm init -y

# 安装核心依赖
npm install express socket.io mysql2 bcryptjs jsonwebtoken cors dotenv
npm install --save-dev pm2 nodemon

# 创建项目结构
mkdir config controllers models routes middleware utils
mkdir public public/images public/uploads
```

### 1.3 配置package.json脚本
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "pm2:start": "pm2 start ecosystem.config.js",
    "pm2:restart": "pm2 restart ecosystem.config.js",
    "pm2:stop": "pm2 stop ecosystem.config.js",
    "pm2:logs": "pm2 logs --lines 100",
    "backup": "node scripts/backup.js"
  }
}
```

## 阶段2：数据库配置

### 2.1 通过phpMyAdmin创建数据库
1. 登录Serv00控制面板
2. 找到phpMyAdmin链接
3. 创建新数据库: `chat_system`
4. 导入数据库架构: `database-schema.sql`

### 2.2 配置数据库连接
创建 `config/database.js`:
```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'chat_system',
  waitForConnections: true,
  connectionLimit: 5,  // Serv00限制，保持低值
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timeout: 60000
});

// 连接测试
pool.getConnection()
  .then(conn => {
    console.log('数据库连接成功');
    conn.release();
  })
  .catch(err => {
    console.error('数据库连接失败:', err);
  });

module.exports = pool;
```

### 2.3 环境变量配置
创建 `.env` 文件:
```env
# 服务器配置
PORT=3000
NODE_ENV=production

# 数据库配置
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=chat_system

# JWT配置
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=24h

# 应用配置
MAX_CONNECTIONS=50
MAX_MESSAGES_PER_MINUTE=30
UPLOAD_LIMIT=5242880  # 5MB
```

## 阶段3：核心应用开发

### 3.1 创建主服务器文件 `server.js`
```javascript
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 1e6, // 1MB
  pingTimeout: 60000,
  pingInterval: 30000
});

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/notifications', require('./routes/notifications'));

// Socket.io连接管理
const socketManager = require('./utils/socketManager')(io);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`聊天服务器运行在端口 ${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在优雅关闭...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
```

### 3.2 PM2配置 `ecosystem.config.js`
```javascript
module.exports = {
  apps: [{
    name: 'chat-server',
    script: 'server.js',
    instances: 1,  // Serv00限制，只能1个实例
    exec_mode: 'fork',
    max_memory_restart: '400M',  // 接近内存限制时重启
    watch: false,
    max_restarts: 5,
    min_uptime: '10s',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '../logs/pm2-error.log',
    out_file: '../logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

### 3.3 认证中间件 `middleware/auth.js`
```javascript
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      code: 'AUTH_REQUIRED',
      message: '需要认证令牌'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_TOKEN',
        message: '无效的认证令牌'
      });
    }
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };
```

### 3.4 Socket管理器 `utils/socketManager.js`
```javascript
const pool = require('../config/database');

module.exports = function(io) {
  const activeConnections = new Map(); // userId -> socketId
  const roomUsers = new Map(); // roomId -> Set of userIds

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('认证失败'));
    }

    try {
      const jwt = require('jsonwebtoken');
      const user = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('无效的令牌'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`用户连接: ${socket.user?.id}`);

    // 记录连接
    if (socket.user) {
      activeConnections.set(socket.user.id, socket.id);
      updateUserStatus(socket.user.id, true);
    }

    // 加入房间
    socket.on('join_room', async (data, callback) => {
      try {
        const { room_id } = data;
        socket.join(`room:${room_id}`);

        // 记录房间用户
        if (!roomUsers.has(room_id)) {
          roomUsers.set(room_id, new Set());
        }
        roomUsers.get(room_id).add(socket.user.id);

        // 通知其他用户
        socket.to(`room:${room_id}`).emit('user_joined', {
          room_id,
          user_id: socket.user.id,
          username: socket.user.username
        });

        // 获取房间在线用户
        const users = Array.from(roomUsers.get(room_id)).map(userId => ({
          user_id: userId,
          username: activeConnections.has(userId) ? '在线' : '离线'
        }));

        callback?.({ success: true, room_id, users });
      } catch (err) {
        callback?.({ success: false, message: err.message });
      }
    });

    // 发送消息
    socket.on('send_message', async (data) => {
      try {
        const { room_id, content, message_type } = data;

        // 频率限制检查
        const canSend = await checkRateLimit(socket.user.id);
        if (!canSend) {
          socket.emit('error', {
            message: '发送消息过于频繁',
            code: 'RATE_LIMIT'
          });
          return;
        }

        // 保存到数据库
        const [result] = await pool.execute(
          `INSERT INTO messages (room_id, user_id, content, message_type)
           VALUES (?, ?, ?, ?)`,
          [room_id, socket.user.id, content, message_type || 'text']
        );

        const messageData = {
          id: result.insertId,
          room_id,
          user_id: socket.user.id,
          username: socket.user.username,
          content,
          message_type: message_type || 'text',
          created_at: new Date().toISOString()
        };

        // 广播到房间
        io.to(`room:${room_id}`).emit('message_received', messageData);

      } catch (err) {
        console.error('发送消息失败:', err);
        socket.emit('error', { message: '发送消息失败' });
      }
    });

    // 输入状态
    socket.on('typing_start', (data) => {
      socket.to(`room:${data.room_id}`).emit('user_typing', {
        room_id: data.room_id,
        user_id: socket.user.id,
        username: socket.user.username
      });
    });

    // 断开连接
    socket.on('disconnect', () => {
      console.log(`用户断开: ${socket.user?.id}`);

      if (socket.user) {
        activeConnections.delete(socket.user.id);
        updateUserStatus(socket.user.id, false);

        // 从所有房间移除
        roomUsers.forEach((users, roomId) => {
          if (users.has(socket.user.id)) {
            users.delete(socket.user.id);
            socket.to(`room:${roomId}`).emit('user_left', {
              room_id: roomId,
              user_id: socket.user.id,
              username: socket.user.username
            });
          }
        });
      }
    });
  });

  // 辅助函数：更新用户在线状态
  async function updateUserStatus(userId, isOnline) {
    try {
      await pool.execute(
        'UPDATE users SET is_online = ?, last_login = ? WHERE id = ?',
        [isOnline, new Date(), userId]
      );

      // 通知所有连接的客户端
      io.emit('user_online_status', {
        user_id: userId,
        is_online: isOnline
      });
    } catch (err) {
      console.error('更新用户状态失败:', err);
    }
  }

  // 辅助函数：频率限制检查
  async function checkRateLimit(userId) {
    const cacheKey = `rate_limit:${userId}`;
    // 简单实现：实际可使用Redis或内存缓存
    return true; // 暂时跳过，后续完善
  }

  return io;
};
```

## 阶段4：部署和启动

### 4.1 部署脚本 `deploy.sh`
```bash
#!/bin/bash

echo "开始部署聊天系统..."

# 进入项目目录
cd ~/domains/chat.yourdomain.com/app

# 拉取最新代码（如果有git）
# git pull origin main

# 安装依赖
echo "安装依赖..."
npm install --production

# 设置环境变量
if [ ! -f .env ]; then
    echo "请手动创建 .env 文件"
    exit 1
fi

# 停止现有进程
echo "停止现有进程..."
pm2 delete chat-server 2>/dev/null || true

# 启动应用
echo "启动应用..."
pm2 start ecosystem.config.js

# 保存PM2配置
pm2 save

# 设置PM2开机启动（如果支持）
pm2 startup 2>/dev/null || true

echo "部署完成！"
echo "查看日志: pm2 logs chat-server"
echo "监控状态: pm2 status"
```

### 4.2 反向代理配置（Apache）
创建 `~/domains/chat.yourdomain.com/.htaccess`:
```apache
RewriteEngine On

# WebSocket支持
RewriteCond %{HTTP:Upgrade} websocket [NC]
RewriteCond %{HTTP:Connection} upgrade [NC]
RewriteRule ^/?(.*) "ws://localhost:3000/$1" [P,L]

# 反向代理到Node.js
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]

# CORS头
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
```

### 4.3 监控脚本 `scripts/monitor.js`
```javascript
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

// 系统状态监控
async function checkSystemStatus() {
  try {
    // 检查数据库连接
    await pool.getConnection();

    // 检查活跃连接数
    const [users] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE is_online = TRUE'
    );

    // 检查消息量
    const [messages] = await pool.execute(
      'SELECT COUNT(*) as count FROM messages WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)'
    );

    const status = {
      timestamp: new Date().toISOString(),
      database: 'connected',
      online_users: users[0].count,
      hourly_messages: messages[0].count,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };

    // 写入日志
    const logFile = path.join(__dirname, '../logs/monitor.log');
    fs.appendFileSync(logFile, JSON.stringify(status) + '\n');

    console.log('系统状态:', status);
    return status;
  } catch (err) {
    console.error('监控检查失败:', err);

    // 发送警报（需要配置邮件服务）
    await sendAlert('数据库连接异常: ' + err.message);
    return { error: err.message };
  }
}

// 警报发送
async function sendAlert(message) {
  console.error('ALERT:', message);
  // 实际部署时可配置邮件或Webhook通知
}

// 定时执行（每5分钟）
if (require.main === module) {
  setInterval(checkSystemStatus, 5 * 60 * 1000);
  checkSystemStatus();
}

module.exports = { checkSystemStatus, sendAlert };
```

### 4.4 备份脚本 `scripts/backup.js`
```javascript
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '../backups');
  const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const command = `mysqldump -h ${process.env.DB_HOST} -u ${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} > ${backupFile}`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('备份失败:', error);
        reject(error);
        return;
      }

      // 压缩备份文件
      exec(`gzip ${backupFile}`, (err) => {
        if (err) {
          reject(err);
          return;
        }

        const compressedFile = `${backupFile}.gz`;
        const stats = fs.statSync(compressedFile);
        console.log(`备份成功: ${compressedFile} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
        resolve(compressedFile);
      });
    });
  });
}

// 清理旧备份（保留最近7天）
function cleanupOldBackups() {
  const backupDir = path.join(__dirname, '../backups');
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  fs.readdir(backupDir, (err, files) => {
    if (err) {
      console.error('读取备份目录失败:', err);
      return;
    }

    files.forEach(file => {
      const filePath = path.join(backupDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;

        if (now - stats.mtimeMs > sevenDays) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error('删除旧备份失败:', err);
            } else {
              console.log('删除旧备份:', file);
            }
          });
        }
      });
    });
  });
}

if (require.main === module) {
  backupDatabase()
    .then(() => cleanupOldBackups())
    .catch(err => console.error('备份过程失败:', err));
}

module.exports = { backupDatabase, cleanupOldBackups };
```

## 阶段5：维护和监控

### 5.1 日常维护命令
```bash
# 查看应用状态
pm2 status

# 查看实时日志
pm2 logs chat-server --lines 50

# 重启应用
pm2 restart chat-server

# 查看资源使用
top -u your_username

# 检查数据库连接
mysql -u your_db_user -p -e "SHOW PROCESSLIST;" chat_system

# 手动备份
node scripts/backup.js
```

### 5.2 性能优化建议

**针对Serv00限制的优化：**
1. **连接池限制**: 保持 `connectionLimit: 5`
2. **消息缓存**: 最近100条消息内存缓存
3. **静态文件**: 使用CDN或压缩图片
4. **心跳频率**: 降低Socket心跳频率到60秒
5. **消息批量**: 批量处理数据库写入

### 5.3 故障排查

**常见问题：**

1. **进程被杀死**
   ```bash
   # 检查PM2状态
   pm2 status
   # 重启应用
   pm2 restart chat-server
   ```

2. **数据库连接失败**
   ```bash
   # 检查MySQL服务
   mysql -u your_db_user -p -e "SELECT 1;" chat_system
   ```

3. **内存不足**
   ```bash
   # 查看内存使用
   free -m
   # 重启释放内存
   pm2 restart chat-server
   ```

4. **端口被占用**
   ```bash
   # 查找进程
   lsof -i :3000
   # 杀死进程
   kill -9 <PID>
   ```

### 5.4 扩展计划

**当用户量增长时的升级路径：**

1. **短期优化**（<50用户）
   - 优化数据库索引
   - 启用消息压缩
   - 减少不必要的心跳

2. **中期扩展**（50-100用户）
   - 引入Redis缓存
   - 实现消息队列
   - 分离静态文件服务

3. **长期方案**（>100用户）
   - 迁移到VPS（DigitalOcean/阿里云）
   - 使用专业消息服务（Pusher/Ably）
   - 数据库读写分离

---

## 部署检查清单

- [ ] Serv00账户已激活并配置SSH
- [ ] 域名已配置并指向Serv00
- [ ] MySQL数据库已创建并导入schema
- [ ] 环境变量文件 `.env` 已配置
- [ ] 所有依赖已安装 (`npm install`)
- [ ] PM2已安装并配置
- [ ] Apache反向代理已配置
- [ ] 监控脚本已设置定时任务
- [ ] 备份脚本已测试
- [ ] 日志目录已创建并有写入权限
- [ ] 文件上传目录权限正确
- [ ] 防火墙端口已开放
- [ ] 测试账户已创建
- [ ] 监控告警已配置

**预计部署时间**: 2-4小时
**首次测试时间**: 1小时
**完整功能测试**: 2小时

**总时间**: 5-7小时完成基础部署
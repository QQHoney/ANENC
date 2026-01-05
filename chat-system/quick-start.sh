#!/bin/bash
# Serv00聊天系统快速部署脚本
# 使用方法: bash quick-start.sh

set -e  # 遇到错误立即退出

echo "=========================================="
echo "🚀 Serv00聊天系统快速部署"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否在Serv00环境
if [ ! -d "/home" ]; then
    echo -e "${RED}错误: 此脚本必须在Serv00环境下运行${NC}"
    exit 1
fi

# 获取当前用户
CURRENT_USER=$(whoami)
echo -e "${GREEN}当前用户: $CURRENT_USER${NC}"

# 步骤1: 创建目录结构
echo -e "\n${YELLOW}步骤1: 创建目录结构...${NC}"
DOMAIN="chat.$CURRENT_USER.serv00.com"
APP_DIR="/home/$CURRENT_USER/domains/$DOMAIN/app"
PUBLIC_DIR="/home/$CURRENT_USER/domains/$DOMAIN/public_html"
LOG_DIR="/home/$CURRENT_USER/domains/$DOMAIN/logs"
BACKUP_DIR="/home/$CURRENT_USER/domains/$DOMAIN/backups"

mkdir -p $APP_DIR $PUBLIC_DIR $LOG_DIR $BACKUP_DIR
echo -e "${GREEN}✓ 目录创建完成${NC}"

# 步骤2: 检查Node.js
echo -e "\n${YELLOW}步骤2: 检查Node.js环境...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js $NODE_VERSION 已安装${NC}"
else
    echo -e "${RED}✗ Node.js 未安装，请联系管理员或使用其他方式安装${NC}"
    echo "提示: Serv00通常通过pkg安装Node.js"
    exit 1
fi

# 步骤3: 检查MySQL
echo -e "\n${YELLOW}步骤3: 检查MySQL环境...${NC}"
if command -v mysql &> /dev/null; then
    echo -e "${GREEN}✓ MySQL客户端已安装${NC}"
else
    echo -e "${YELLOW}⚠ MySQL客户端未找到，但phpMyAdmin可能可用${NC}"
fi

# 步骤4: 初始化项目
echo -e "\n${YELLOW}步骤4: 初始化Node.js项目...${NC}"
cd $APP_DIR

if [ ! -f "package.json" ]; then
    npm init -y > /dev/null 2>&1
    echo -e "${GREEN}✓ package.json 创建完成${NC}"
else
    echo -e "${GREEN}✓ package.json 已存在${NC}"
fi

# 步骤5: 安装依赖
echo -e "\n${YELLOW}步骤5: 安装依赖包...${NC}"
echo "这可能需要几分钟..."

npm install express socket.io mysql2 bcryptjs jsonwebtoken cors dotenv > /dev/null 2>&1
npm install --save-dev pm2 nodemon > /dev/null 2>&1

echo -e "${GREEN}✓ 依赖安装完成${NC}"

# 步骤6: 创建基础文件
echo -e "\n${YELLOW}步骤6: 创建基础文件...${NC}"

# 创建基础server.js
cat > server.js << 'EOF'
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  maxHttpBufferSize: 1e6,
  pingTimeout: 60000,
  pingInterval: 30000
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 基础健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 基础测试接口
app.get('/', (req, res) => {
  res.json({
    message: 'Serv00聊天系统运行中',
    version: '1.0.0',
    docs: '/api-docs'
  });
});

// 简单的Socket连接测试
io.on('connection', (socket) => {
  console.log('新连接:', socket.id);

  socket.on('test', (data) => {
    socket.emit('test-response', { received: data, server: 'Serv00' });
  });

  socket.on('disconnect', () => {
    console.log('断开连接:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Serv00聊天系统运行在端口 ${PORT}`);
  console.log(`📊 监控: http://localhost:${PORT}/health`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到关闭信号，正在退出...');
  server.close(() => process.exit(0));
});
EOF

# 创建PM2配置
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'chat-server',
    script: 'server.js',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '400M',
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
EOF

# 创建基础.env文件
cat > .env << EOF
PORT=3000
NODE_ENV=production
DB_HOST=localhost
DB_USER=$CURRENT_USER
DB_PASSWORD=your_mysql_password
DB_NAME=chat_system
JWT_SECRET=change_this_secret_key_in_production
JWT_EXPIRE=24h
MAX_CONNECTIONS=50
MAX_MESSAGES_PER_MINUTE=30
EOF

echo -e "${GREEN}✓ 基础文件创建完成${NC}"

# 步骤7: 创建public目录结构
echo -e "\n${YELLOW}步骤7: 创建前端文件...${NC}"
mkdir -p $APP_DIR/public/{css,js,images}

# 创建基础HTML
cat > $APP_DIR/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Serv00聊天系统</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .status { padding: 10px; margin: 10px 0; border-radius: 4px; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
        .info { background: #d1ecf1; color: #0c5460; }
        button { padding: 10px 20px; margin: 5px; cursor: pointer; }
        input { padding: 8px; margin: 5px; width: 200px; }
        #messages { height: 300px; overflow-y: scroll; border: 1px solid #ddd; padding: 10px; margin: 10px 0; }
        .message { margin: 5px 0; padding: 5px; background: #f8f9fa; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Serv00聊天系统测试</h1>
        <div id="status" class="status info">等待连接...</div>

        <div>
            <h3>服务器测试</h3>
            <button onclick="testHealth()">健康检查</button>
            <button onclick="testSocket()">Socket连接</button>
            <button onclick="testMessage()">发送测试消息</button>
        </div>

        <div>
            <h3>用户测试</h3>
            <input type="text" id="username" placeholder="用户名" value="testuser">
            <input type="email" id="email" placeholder="邮箱" value="test@example.com">
            <input type="password" id="password" placeholder="密码" value="test123">
            <br>
            <button onclick="register()">注册</button>
            <button onclick="login()">登录</button>
            <button onclick="getProfile()">获取资料</button>
        </div>

        <div>
            <h3>聊天测试</h3>
            <input type="number" id="roomId" placeholder="房间ID" value="1">
            <input type="text" id="messageContent" placeholder="消息内容" style="width: 300px;">
            <br>
            <button onclick="joinRoom()">加入房间</button>
            <button onclick="sendMessage()">发送消息</button>
            <button onclick="getMessages()">获取消息历史</button>
        </div>

        <div id="messages"></div>
    </div>

    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
    <script>
        let socket = null;
        let authToken = localStorage.getItem('token');

        function log(message, type = 'info') {
            const status = document.getElementById('status');
            status.className = `status ${type}`;
            status.textContent = message;
            console.log(`[${type}]`, message);
        }

        function addMessage(msg) {
            const messages = document.getElementById('messages');
            const div = document.createElement('div');
            div.className = 'message';
            div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
            messages.appendChild(div);
            messages.scrollTop = messages.scrollHeight;
        }

        // 健康检查
        async function testHealth() {
            try {
                const response = await fetch('/health');
                const data = await response.json();
                log(`健康检查: ${JSON.stringify(data)}`, 'success');
            } catch (err) {
                log(`健康检查失败: ${err.message}`, 'error');
            }
        }

        // Socket测试
        function testSocket() {
            if (socket && socket.connected) {
                log('Socket已连接', 'success');
                return;
            }

            socket = io('/', {
                auth: { token: authToken }
            });

            socket.on('connect', () => {
                log(`Socket连接成功: ${socket.id}`, 'success');
                addMessage('系统: Socket已连接');
            });

            socket.on('connect_error', (err) => {
                log(`Socket连接错误: ${err.message}`, 'error');
            });

            socket.on('test-response', (data) => {
                log(`Socket测试响应: ${JSON.stringify(data)}`, 'success');
            });

            socket.on('message_received', (data) => {
                addMessage(`${data.username}: ${data.content}`);
            });
        }

        // 发送测试消息
        function testMessage() {
            if (!socket || !socket.connected) {
                log('请先连接Socket', 'error');
                return;
            }
            socket.emit('test', { test: 'Serv00聊天系统', time: new Date().toISOString() });
            log('发送测试消息', 'info');
        }

        // 注册
        async function register() {
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });
                const data = await response.json();

                if (data.success) {
                    log(`注册成功: ${data.data.username}`, 'success');
                    authToken = data.data.token;
                    localStorage.setItem('token', authToken);
                } else {
                    log(`注册失败: ${data.message}`, 'error');
                }
            } catch (err) {
                log(`注册错误: ${err.message}`, 'error');
            }
        }

        // 登录
        async function login() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();

                if (data.success) {
                    log(`登录成功: ${data.data.username}`, 'success');
                    authToken = data.data.token;
                    localStorage.setItem('token', authToken);
                } else {
                    log(`登录失败: ${data.message}`, 'error');
                }
            } catch (err) {
                log(`登录错误: ${err.message}`, 'error');
            }
        }

        // 获取资料
        async function getProfile() {
            if (!authToken) {
                log('请先登录', 'error');
                return;
            }

            try {
                const response = await fetch('/api/auth/profile', {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                const data = await response.json();

                if (data.success) {
                    log(`用户资料: ${JSON.stringify(data.data)}`, 'success');
                } else {
                    log(`获取资料失败: ${data.message}`, 'error');
                }
            } catch (err) {
                log(`获取资料错误: ${err.message}`, 'error');
            }
        }

        // 加入房间
        function joinRoom() {
            if (!socket || !socket.connected) {
                log('请先连接Socket', 'error');
                return;
            }

            const roomId = document.getElementById('roomId').value;
            socket.emit('join_room', { room_id: parseInt(roomId) }, (response) => {
                if (response.success) {
                    log(`加入房间${roomId}成功`, 'success');
                    addMessage(`系统: 加入房间 ${roomId}`);
                } else {
                    log(`加入房间失败: ${response.message}`, 'error');
                }
            });
        }

        // 发送消息
        function sendMessage() {
            if (!socket || !socket.connected) {
                log('请先连接Socket', 'error');
                return;
            }

            const roomId = document.getElementById('roomId').value;
            const content = document.getElementById('messageContent').value;

            if (!content) {
                log('请输入消息内容', 'error');
                return;
            }

            socket.emit('send_message', {
                room_id: parseInt(roomId),
                content: content,
                message_type: 'text'
            });

            addMessage(`我: ${content}`);
            document.getElementById('messageContent').value = '';
            log('消息已发送', 'info');
        }

        // 获取消息历史
        async function getMessages() {
            if (!authToken) {
                log('请先登录', 'error');
                return;
            }

            const roomId = document.getElementById('roomId').value;

            try {
                const response = await fetch(`/api/messages/${roomId}`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                const data = await response.json();

                if (data.success) {
                    log(`消息历史: ${data.data.length}条`, 'success');
                    data.data.forEach(msg => {
                        addMessage(`${msg.username}: ${msg.content}`);
                    });
                } else {
                    log(`获取消息失败: ${data.message}`, 'error');
                }
            } catch (err) {
                log(`获取消息错误: ${err.message}`, 'error');
            }
        }

        // 页面加载时自动连接Socket
        window.addEventListener('load', () => {
            if (authToken) {
                log('检测到token，自动连接Socket...', 'info');
                testSocket();
            } else {
                log('请先注册或登录', 'info');
            }
        });
    </script>
</body>
</html>
EOF

echo -e "${GREEN}✓ 前端测试页面创建完成${NC}"

# 步骤8: 创建部署脚本
echo -e "\n${YELLOW}步骤8: 创建部署脚本...${NC}"

cat > $APP_DIR/deploy.sh << 'EOF'
#!/bin/bash
echo "开始部署..."

# 停止现有进程
pm2 delete chat-server 2>/dev/null || true

# 启动应用
pm2 start ecosystem.config.js

# 保存配置
pm2 save

echo "部署完成！"
echo "查看日志: pm2 logs chat-server"
echo "监控状态: pm2 status"
EOF

chmod +x $APP_DIR/deploy.sh

# 步骤9: 显示下一步说明
echo -e "\n${GREEN}=========================================="
echo -e "🎉 部署准备完成！"
echo -e "==========================================${NC}"

echo -e "\n${YELLOW}📁 项目目录: $APP_DIR"
echo -e "🌐 Web目录: $PUBLIC_DIR"
echo -e "📊 日志目录: $LOG_DIR"
echo -e "💾 备份目录: $BACKUP_DIR${NC}"

echo -e "\n${YELLOW}📋 下一步操作:${NC}"
echo -e "1. ${GREEN}配置数据库:${NC}"
echo -e "   - 登录phpMyAdmin"
echo -e "   - 创建数据库: chat_system"
echo -e "   - 导入: $APP_DIR/database-schema.sql (需要先创建)"
echo -e "   - 更新: $APP_DIR/.env 中的数据库密码"

echo -e "\n2. ${GREEN}测试基础功能:${NC}"
echo -e "   cd $APP_DIR"
echo -e "   node server.js"
echo -e "   访问: http://serv00.com:3000 (或你的域名)"

echo -e "\n3. ${GREEN}正式部署:${NC}"
echo -e "   cd $APP_DIR"
echo -e "   ./deploy.sh"
echo -e "   pm2 status"

echo -e "\n4. ${GREEN}配置反向代理:${NC}"
echo -e "   编辑: $PUBLIC_DIR/.htaccess"
echo -e "   添加Apache代理规则"

echo -e "\n${RED}⚠️ 重要提醒:${NC}"
echo -e "- Serv00资源有限，控制用户规模"
echo -e "- 定期备份数据库"
echo -e "- 监控内存使用 (pm2 monit)"
echo -e "- 保持PM2进程守护"

echo -e "\n${GREEN}🚀 项目文档:${NC}"
echo -e "- 详细部署: deployment-guide.md"
echo -e "- API文档: api-spec.md"
echo -e "- 测试计划: test-plan.md"
echo -e "- 项目路线: project-roadmap.md"

echo -e "\n${GREEN}=========================================="
echo -e "✅ 快速部署脚本执行完成！"
echo -e "==========================================${NC}"
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

安能物流农场是一个物流主题的网页游戏，采用前后端分离架构：
- **前端**：纯 HTML5 + CSS3 + JavaScript (ES6+)
- **后端**：Node.js + Express + MySQL + WebSocket

## 常用命令

### 后端开发

```bash
# 进入后端目录
cd server

# 安装依赖
npm install

# 开发模式启动（热重载）
npm run dev

# 生产模式启动
npm start

# 数据库初始化
mysql -u 用户名 -p 数据库名 < database.sql
```

### 前端开发

前端为纯静态文件，直接在浏览器打开 `index.html` 即可。后端启动后会自动托管前端静态文件。

## 架构设计

### 前端架构

```
js/
├── config.js      # 游戏配置（货物类型、商品、成就、任务等）
├── storage.js     # localStorage 封装
├── api-client.js  # 后端 API 客户端 + WebSocket 客户端
├── utils.js       # 工具函数
└── app.js         # 主应用逻辑（单一 App 对象，包含所有功能）
```

**关键设计**：
- `App` 对象是单例，包含所有页面逻辑和状态
- `api-client.js` 中的 `wsClient` 是全局 WebSocket 实例
- 页面切换通过 `Utils.switchPage()` 实现，所有页面在同一个 HTML 中

### 后端架构

```
server/
├── app.js           # Express 主入口，路由注册
├── db.js            # MySQL 连接池封装
├── websocket.js     # WebSocket 服务（实时聊天）
├── middleware/
│   └── auth.js      # JWT 认证中间件
└── routes/          # API 路由模块
    ├── auth.js      # 注册/登录
    ├── user.js      # 用户信息
    ├── station.js   # 站场货物（核心玩法）
    ├── friend.js    # 好友系统
    ├── chat.js      # 聊天记录查询
    ├── shop.js      # 商城购买
    ├── ranking.js   # 排行榜
    ├── achievement.js
    ├── checkIn.js
    └── task.js
```

**关键设计**：
- 所有 API 返回 `{ success: boolean, data?: any, message?: string }` 格式
- JWT Token 通过 `Authorization: Bearer <token>` 传递
- WebSocket 消息通过 `websocket.js` 中的 `broadcastToBranch()` 和 `broadcastToAll()` 分发

### 数据库表结构

核心表：
- `users` - 用户信息（含密码哈希、等级、金币等）
- `user_items` - 用户道具
- `station_cargos` - 站场货物
- `friends` - 好友关系
- `branch_messages` / `world_messages` / `private_messages` - 聊天消息
- `rankings` - 排行榜（冗余存储，定期更新）

### WebSocket 消息流

```
客户端连接 → 发送 auth{token} → 服务端验证 → 加入分拨房间
                                           ↓
分拨聊天 ← broadcastToBranch() ← branch_message
世界聊天 ← broadcastToAll() ← world_message
私聊 ← 直接发送给目标用户 ← private_message
```

## 环境配置

后端需要 `.env` 文件：

```env
PORT=3000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=密码
DB_NAME=ane_farm
JWT_SECRET=随机32位字符串
JWT_EXPIRES_IN=7d
```

## API 认证

需要认证的接口使用 `authMiddleware`：
```javascript
const { authMiddleware } = require('../middleware/auth');
router.get('/info', authMiddleware, async (req, res) => {
    // req.userId 可用
});
```

## 游戏核心逻辑

1. **货物系统**：放置 → 等待 growTime → 收取获得金币/经验
2. **截胡**：只能截已成熟且未受保护的货物，获得 30% 价值
3. **升级**：经验达到 `level * 100` 自动升级，每 5 级增加货位
4. **实时聊天**：通过 WebSocket 推送，前端 `App.appendChatMessage()` 处理

## 部署说明

详见 `DEPLOYMENT_GUIDE.md`，主要步骤：
1. 创建 MySQL 数据库并导入 `database.sql`
2. 配置 `.env` 环境变量
3. `npm install` 安装依赖
4. `node app.js` 或使用 PM2 启动

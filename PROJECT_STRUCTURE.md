# 安能物流农场游戏 - 项目文件结构

## 后端文件 (server/)

```
server/
├── package.json          # Node.js 依赖配置
├── app.js               # 主入口文件
├── db.js                # 数据库连接模块
├── websocket.js         # WebSocket 实时通信模块
├── database.sql         # MySQL 数据库初始化脚本
├── .env.example         # 环境变量示例
├── .gitignore           # Git 忽略文件
├── middleware/
│   └── auth.js          # JWT 认证中间件
└── routes/
    ├── auth.js          # 认证路由 (注册/登录)
    ├── user.js          # 用户路由
    ├── station.js       # 站场货物路由
    ├── friend.js        # 好友路由
    ├── chat.js          # 聊天路由
    ├── shop.js          # 商城路由
    ├── ranking.js       # 排行榜路由
    ├── achievement.js   # 成就路由
    ├── checkIn.js       # 签到路由
    └── task.js          # 任务路由
```

## 前端修改

- `index.html` - 修改了登录表单（添加密码字段）、更换 api.js 为 api-client.js
- `js/api-client.js` - 新增：真实后端 API 客户端 + WebSocket 客户端
- `js/app.js` - 修改了登录/注册/退出逻辑以适配真实后端

## 部署相关

- `DEPLOY.md` - Serv00 部署详细指南

## 快速部署步骤

1. 上传所有文件到 Serv00
2. 创建 MySQL 数据库
3. 导入 `server/database.sql`
4. 复制 `.env.example` 为 `.env` 并配置数据库信息
5. 运行 `npm install` 安装依赖
6. 启动应用 `node app.js` 或使用 PM2

## 主要功能

- 真实用户注册/登录（密码加密存储）
- JWT Token 认证
- MySQL 数据持久化
- WebSocket 实时聊天（分拨聊天、世界聊天、私聊）
- 完整的游戏功能 API

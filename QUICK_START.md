# 快速部署指南

## 1. 准备工作

确保你有：
- Serv00 账号
- SSH 客户端
- SFTP 客户端（如 FileZilla）

## 2. 上传文件

将整个项目上传到 Serv00：
```
/home/你的用户名/domains/你的域名/public_nodejs/
```

## 3. 创建数据库

通过 Serv00 面板创建 MySQL 数据库，记下：
- 数据库主机
- 用户名
- 密码
- 数据库名

## 4. 导入数据库

```bash
cd ~/domains/你的域名/public_nodejs/server
mysql -u 用户名 -p 数据库名 < database.sql
```

## 5. 配置环境变量

```bash
cd ~/domains/你的域名/public_nodejs/server
cp .env.example .env
nano .env
```

修改以下配置：
```env
DB_HOST=mysql.serv00.com
DB_USER=你的用户名
DB_PASSWORD=你的密码
DB_NAME=你的数据库名
JWT_SECRET=随机32位字符串
```

## 6. 安装依赖并启动

```bash
cd ~/domains/你的域名/public_nodejs/server
npm install
node app.js
```

或使用 PM2：
```bash
pm2 start app.js --name "ane-farm"
pm2 save
```

## 7. 验证

访问 `https://你的域名/api/health` 检查服务是否正常。

## 文件清单

### 后端 (server/)
- `app.js` - 主入口
- `db.js` - 数据库连接
- `websocket.js` - WebSocket 实时通信
- `database.sql` - 数据库初始化
- `middleware/auth.js` - JWT 认证
- `routes/*.js` - API 路由

### 前端修改
- `index.html` - 添加密码字段，引用 api-client.js
- `js/api-client.js` - 真实后端 API + WebSocket
- `js/app.js` - 登录/注册/聊天逻辑修改

## 常见问题

1. **数据库连接失败** - 检查 .env 配置
2. **502 错误** - 检查 Node.js 应用是否启动
3. **WebSocket 不工作** - 确保使用 wss:// 协议

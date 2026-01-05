# 安能物流农场游戏 - Serv00 完整部署指南

## 目录

1. [项目概述](#项目概述)
2. [系统要求](#系统要求)
3. [项目文件结构](#项目文件结构)
4. [第一步：注册 Serv00 账号](#第一步注册-serv00-账号)
5. [第二步：登录服务器](#第二步登录服务器)
6. [第三步：创建 MySQL 数据库](#第三步创建-mysql-数据库)
7. [第四步：上传项目文件](#第四步上传项目文件)
8. [第五步：配置环境变量](#第五步配置环境变量)
9. [第六步：初始化数据库](#第六步初始化数据库)
10. [第七步：安装依赖](#第七步安装依赖)
11. [第八步：配置 Node.js 应用](#第八步配置-nodejs-应用)
12. [第九步：启动应用](#第九步启动应用)
13. [第十步：验证部署](#第十步验证部署)
14. [常见问题排查](#常见问题排查)
15. [维护与更新](#维护与更新)
16. [API 接口列表](#api-接口列表)
17. [WebSocket 消息类型](#websocket-消息类型)

---

## 项目概述

本项目是一个基于 Node.js + MySQL + WebSocket 的网页游戏，主要功能包括：

- **用户系统**：真实用户注册/登录，密码加密存储（bcrypt），JWT Token 认证
- **游戏功能**：站场货物管理、截胡好友、商城购买、成就系统、签到奖励、任务系统
- **社交功能**：分拨聊天、世界聊天、私聊（全部基于 WebSocket 实时通信）
- **排行榜**：财富榜、等级榜、截胡榜

---

## 系统要求

Serv00 免费服务器需要支持：
- **Node.js 18+**
- **MySQL 5.7+**
- **WebSocket**

---

## 项目文件结构

```
web/
├── index.html                 # 前端主页面（已修改：添加密码字段）
├── css/                       # 样式文件
│   ├── reset.css
│   ├── common.css
│   ├── pages.css
│   └── animations.css
├── js/                        # 前端脚本
│   ├── config.js              # 游戏配置
│   ├── storage.js             # 本地存储封装
│   ├── api-client.js          # 【核心】真实后端 API 客户端 + WebSocket
│   ├── utils.js               # 工具函数
│   └── app.js                 # 主应用逻辑（已修改适配后端）
├── assets/                    # 静态资源
│   ├── avatars/               # 头像图片
│   └── icons/                 # 图标
├── server/                    # 后端服务器
│   ├── package.json           # Node.js 依赖配置
│   ├── app.js                 # 服务器主入口
│   ├── db.js                  # 数据库连接模块
│   ├── websocket.js           # WebSocket 实时通信
│   ├── database.sql           # 数据库初始化脚本
│   ├── .env.example           # 环境变量示例
│   ├── .gitignore             # Git 忽略配置
│   ├── middleware/
│   │   └── auth.js            # JWT 认证中间件
│   └── routes/
│       ├── auth.js            # 认证路由（注册/登录）
│       ├── user.js            # 用户路由
│       ├── station.js         # 站场货物路由
│       ├── friend.js          # 好友路由
│       ├── chat.js            # 聊天路由
│       ├── shop.js            # 商城路由
│       ├── ranking.js         # 排行榜路由
│       ├── achievement.js     # 成就路由
│       ├── checkIn.js         # 签到路由
│       └── task.js            # 任务路由
└── DEPLOYMENT_GUIDE.md        # 本部署指南
```

---

## 第一步：注册 Serv00 账号

1. 访问 https://serv00.com
2. 点击 **Register** 注册账号
3. 填写信息并完成注册
4. 检查邮箱，获取：
   - 服务器地址（如 `s1.serv00.com`）
   - 用户名
   - 初始密码
5. 首次登录面板后修改密码

---

## 第二步：登录服务器

### 方式一：SSH 命令行（推荐）

**Windows (PowerShell 或 CMD):**
```bash
ssh 你的用户名@你的服务器.serv00.com
```

输入密码后即可登录。

### 方式二：网页面板

1. 访问 https://panel.serv00.com
2. 使用账号密码登录
3. 可以在网页上管理文件和数据库

---

## 第三步：创建 MySQL 数据库

### 通过网页面板创建（推荐）

1. 登录 Serv00 面板 https://panel.serv00.com
2. 左侧菜单找到 **MySQL** 或 **Databases**
3. 点击 **Add new database**
4. 填写数据库名称，例如：`ane_farm`
5. 设置数据库密码（记住这个密码！）
6. 点击创建

**记录以下信息（后面要用）：**
```
数据库主机: mysql.serv00.com（或面板显示的地址）
数据库用户名: 你的serv00用户名
数据库密码: 你刚才设置的密码
数据库名: 你创建的数据库名（如 ane_farm）
```

---

## 第四步：上传项目文件

### 方式一：使用 FileZilla（推荐）

1. 下载安装 FileZilla：https://filezilla-project.org

2. 连接服务器：
   - 主机：`你的服务器.serv00.com`
   - 用户名：你的 Serv00 用户名
   - 密码：你的密码
   - 端口：`22`

3. 在远程服务器上导航到：
   ```
   /home/你的用户名/domains/你的域名/public_nodejs/
   ```

   如果没有 `public_nodejs` 目录，创建一个。

4. 将本地 `web` 文件夹中的**所有内容**上传到该目录

**上传后的目录结构应该是：**
```
/home/你的用户名/domains/你的域名/public_nodejs/
├── index.html
├── css/
├── js/
├── assets/
└── server/
    ├── package.json
    ├── app.js
    ├── database.sql
    └── ...
```

### 方式二：使用 Git

```bash
# SSH 登录后
cd ~/domains/你的域名/public_nodejs
git clone 你的仓库地址 .
```

---

## 第五步：配置环境变量

### 1. SSH 登录服务器

```bash
ssh 你的用户名@你的服务器.serv00.com
```

### 2. 进入 server 目录

```bash
cd ~/domains/你的域名/public_nodejs/server
```

### 3. 复制环境变量示例文件

```bash
cp .env.example .env
```

### 4. 编辑环境变量

```bash
nano .env
```

### 5. 修改配置内容

```env
# 服务器配置
PORT=3000
NODE_ENV=production

# MySQL 数据库配置（使用你在第三步记录的信息）
DB_HOST=mysql.serv00.com
DB_PORT=3306
DB_USER=你的serv00用户名
DB_PASSWORD=你的数据库密码
DB_NAME=你的数据库名

# JWT 配置（请修改为随机字符串）
JWT_SECRET=请替换为随机字符串至少32位abcdef123456789
JWT_EXPIRES_IN=7d
```

### 6. 生成随机 JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

将输出的随机字符串复制到 `JWT_SECRET=` 后面。

### 7. 保存并退出

按 `Ctrl+X`，然后按 `Y`，再按 `Enter`

---

## 第六步：初始化数据库

### 方式一：命令行导入

```bash
cd ~/domains/你的域名/public_nodejs/server
mysql -u 你的用户名 -p 你的数据库名 < database.sql
mysql -u m7732_nc -p m7732_nc < database.sql
```

输入数据库密码，等待导入完成。

### 方式二：phpMyAdmin 导入

1. 登录 Serv00 面板
2. 找到 **phpMyAdmin** 并进入
3. 左侧选择你的数据库
4. 点击顶部 **Import（导入）**
5. 点击 **Choose File** 选择 `server/database.sql` 文件
6. 点击 **Go（执行）**

---

## 第七步：安装依赖

```bash
cd ~/domains/你的域名/public_nodejs/server
npm install
```

等待安装完成，可能需要几分钟。

如果遇到权限问题，尝试：
```bash
npm install --no-optional
```

---

## 第八步：配置 Node.js 应用

### 通过 Serv00 面板配置

1. 登录 Serv00 面板
2. 进入 **WWW Websites** 或 **网站管理**
3. 找到你的域名，点击编辑
4. 设置网站类型为 **Node.js**
5. 配置以下参数：
   - **Node.js version**: 18.x 或更高
   - **Application root**: `/home/你的用户名/domains/你的域名/public_nodejs/server`
   - **Application startup file**: `app.js`
   - **Application URL**: 你的域名

6. 保存配置

---

## 第九步：启动应用

### 方式一：通过面板启动

在 Serv00 面板的网站管理中，点击 **Start** 或 **Restart**

### 方式二：通过 SSH 启动

```bash
cd ~/domains/你的域名/public_nodejs/server

# 测试启动（前台运行，用于调试）
node app.js

# 如果看到以下输出，说明启动成功：
# 数据库连接成功
# 服务器运行在端口 3000
# WebSocket 服务已启动
```

### 方式三：使用 PM2（推荐用于生产环境）

```bash
# 安装 PM2（如果没有）
npm install -g pm2

# 启动应用
cd ~/domains/你的域名/public_nodejs/server
pm2 start app.js --name "ane-farm"

# 设置开机自启
pm2 save
pm2 startup

# 查看运行状态
pm2 status

# 查看日志
pm2 logs ane-farm
```

---

## 第十步：验证部署

### 1. 检查健康接口

在浏览器访问：
```
https://你的域名/api/health
```

应该返回：
```json
{"status":"ok","time":"2024-..."}
```

### 2. 访问游戏页面

在浏览器访问：
```
https://你的域名/
```

应该看到游戏登录页面，包含昵称和密码输入框。

### 3. 测试注册和登录

1. 输入昵称和密码（密码至少6位）
2. 点击"注册新账号"
3. 选择分拨并确认
4. 应该成功进入游戏主页

### 4. 测试聊天功能

1. 进入聊天页面
2. 发送一条消息
3. 消息应该实时显示（WebSocket 工作正常）

---

## 常见问题排查

### 问题 1：数据库连接失败

**错误信息：** `无法连接数据库，服务启动失败`

**解决方案：**
1. 检查 `.env` 文件中的数据库配置是否正确
2. 确认数据库已创建
3. 确认数据库用户名和密码正确
4. 尝试手动连接测试：
   ```bash
   mysql -u 用户名 -p -h mysql.serv00.com 数据库名
   ```

### 问题 2：502 Bad Gateway

**可能原因：**
- Node.js 应用未启动
- 端口配置错误

**解决方案：**
1. SSH 登录后检查应用是否运行：
   ```bash
   pm2 status
   # 或
   ps aux | grep node
   ```
2. 查看错误日志：
   ```bash
   pm2 logs ane-farm --err
   ```
3. 检查面板中的端口配置

### 问题 3：WebSocket 连接失败

**错误信息：** 控制台显示 WebSocket 连接错误

**解决方案：**
1. 确保使用 `wss://` 而不是 `ws://`（HTTPS 站点需要）
2. 检查服务器是否支持 WebSocket
3. 查看 `js/api-client.js` 中的 WebSocket URL 配置

### 问题 4：静态文件 404

**解决方案：**
1. 检查文件是否上传完整
2. 检查文件路径大小写（Linux 区分大小写）
3. 检查 `server/app.js` 中的静态文件路径配置

### 问题 5：注册/登录失败

**解决方案：**
1. 检查数据库表是否创建成功
2. 查看服务器日志：
   ```bash
   pm2 logs ane-farm
   ```
3. 使用浏览器开发者工具查看网络请求

### 问题 6：跨域错误

**解决方案：**
后端已配置 CORS，如果仍有问题，检查 `server/app.js` 中的 CORS 配置：
```javascript
app.use(cors());
```

---

## 维护与更新

### 查看日志

```bash
# PM2 日志
pm2 logs ane-farm

# 实时查看
pm2 logs ane-farm --lines 100
```

### 重启应用

```bash
pm2 restart ane-farm
```

### 停止应用

```bash
pm2 stop ane-farm
```

### 更新代码

```bash
# 如果使用 Git
cd ~/domains/你的域名/public_nodejs
git pull

# 如果有新依赖
cd server
npm install

# 重启应用
pm2 restart ane-farm
```

### 备份数据库

```bash
mysqldump -u 用户名 -p 数据库名 > backup_$(date +%Y%m%d).sql
```

### 恢复数据库

```bash
mysql -u 用户名 -p 数据库名 < backup_20240101.sql
```

---

## API 接口列表

### 认证相关（无需 Token）

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/branches` | GET | 获取分拨列表 |

### 用户相关（需要 Token）

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/user/info` | GET | 获取用户信息 |
| `/api/user/update` | POST | 更新用户信息 |
| `/api/user/addExp` | POST | 增加经验值 |

### 站场相关（需要 Token）

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/station/cargos` | GET | 获取货物列表 |
| `/api/station/place` | POST | 放置货物 |
| `/api/station/harvest` | POST | 收取货物 |
| `/api/station/protect` | POST | 使用防护盾 |
| `/api/station/speedup` | POST | 使用加速卡 |
| `/api/station/steal` | POST | 截胡货物 |
| `/api/station/friend/:id` | GET | 获取好友站场 |

### 好友相关（需要 Token）

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/friend/list` | GET | 获取好友列表 |
| `/api/friend/add` | POST | 添加好友 |
| `/api/friend/remove` | POST | 删除好友 |
| `/api/friend/branch/:id` | GET | 获取分拨成员 |
| `/api/friend/search` | GET | 搜索用户 |

### 聊天相关（需要 Token）

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/chat/branch/:id` | GET | 获取分拨聊天记录 |
| `/api/chat/world` | GET | 获取世界聊天记录 |
| `/api/chat/private/:id` | GET | 获取私聊记录 |
| `/api/chat/conversations` | GET | 获取会话列表 |
| `/api/chat/read/:id` | POST | 标记会话已读 |
| `/api/chat/unread` | GET | 获取未读消息数 |

### 商城相关（需要 Token）

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/shop/items` | GET | 获取商品列表 |
| `/api/shop/buy` | POST | 购买商品 |

### 排行榜（需要 Token）

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/ranking/:type` | GET | 获取排行榜 |
| `/api/ranking/:type/my` | GET | 获取我的排名 |

### 成就相关（需要 Token）

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/achievement/all` | GET | 获取所有成就 |
| `/api/achievement/claim` | POST | 领取成就奖励 |
| `/api/achievement/claimable` | GET | 获取可领取成就 |

### 签到相关（需要 Token）

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/checkIn/status` | GET | 获取签到状态 |
| `/api/checkIn/do` | POST | 执行签到 |
| `/api/checkIn/rewards` | GET | 获取签到奖励预览 |

### 任务相关（需要 Token）

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/task/all` | GET | 获取所有任务 |
| `/api/task/progress` | POST | 更新任务进度 |
| `/api/task/claim` | POST | 领取任务奖励 |

---

## WebSocket 消息类型

### 客户端发送

| 类型 | 说明 | 数据格式 |
|------|------|----------|
| `auth` | 认证 | `{ type: 'auth', token: 'jwt_token' }` |
| `branch_message` | 分拨聊天 | `{ type: 'branch_message', content: '消息内容' }` |
| `world_message` | 世界聊天 | `{ type: 'world_message', content: '消息内容' }` |
| `private_message` | 私聊 | `{ type: 'private_message', targetUserId: 'user_xxx', content: '消息', messageType: 'text' }` |
| `typing` | 正在输入 | `{ type: 'typing', targetUserId: 'user_xxx', isTyping: true }` |
| `ping` | 心跳 | `{ type: 'ping' }` |

### 服务端推送

| 类型 | 说明 | 数据格式 |
|------|------|----------|
| `auth_success` | 认证成功 | `{ type: 'auth_success', userId: 'user_xxx' }` |
| `auth_error` | 认证失败 | `{ type: 'auth_error', message: '认证失败' }` |
| `branch_message` | 分拨消息 | `{ type: 'branch_message', message: {...} }` |
| `world_message` | 世界消息 | `{ type: 'world_message', message: {...} }` |
| `private_message` | 私聊消息 | `{ type: 'private_message', message: {...} }` |
| `user_online` | 用户上线 | `{ type: 'user_online', userId: 'user_xxx', timestamp: 1234567890 }` |
| `user_offline` | 用户下线 | `{ type: 'user_offline', userId: 'user_xxx', timestamp: 1234567890 }` |
| `error` | 错误 | `{ type: 'error', message: '错误信息' }` |
| `pong` | 心跳响应 | `{ type: 'pong' }` |

---

## 数据库表说明

| 表名 | 说明 |
|------|------|
| `users` | 用户基本信息（昵称、密码哈希、等级、金币等） |
| `user_items` | 用户道具库存 |
| `station_cargos` | 站场货物 |
| `friends` | 好友关系 |
| `branch_messages` | 分拨聊天记录 |
| `world_messages` | 世界聊天记录 |
| `private_messages` | 私聊记录 |
| `conversations` | 会话列表 |
| `user_achievements` | 用户成就记录 |
| `chat_stats` | 聊天统计（用于成就） |
| `check_ins` | 签到记录 |
| `task_progress` | 任务进度 |
| `rankings` | 排行榜 |
| `online_status` | 用户在线状态 |

---

## 技术栈总结

| 组件 | 技术 |
|------|------|
| 前端 | HTML5 + CSS3 + JavaScript (ES6+) |
| 后端 | Node.js + Express |
| 数据库 | MySQL |
| 实时通信 | WebSocket (ws 库) |
| 认证 | JWT (jsonwebtoken) |
| 密码加密 | bcryptjs |
| 环境变量 | dotenv |

---

祝你部署顺利！如有问题，请按照"常见问题排查"部分逐一检查。

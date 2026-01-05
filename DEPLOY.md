# 安能物流农场游戏 - Serv00 部署指南

本指南详细说明如何将游戏部署到 Serv00 免费服务器。

## 目录

1. [准备工作](#准备工作)
2. [登录 Serv00](#登录-serv00)
3. [创建 MySQL 数据库](#创建-mysql-数据库)
4. [上传项目文件](#上传项目文件)
5. [配置 Node.js 应用](#配置-nodejs-应用)
6. [配置环境变量](#配置环境变量)
7. [初始化数据库](#初始化数据库)
8. [启动应用](#启动应用)
9. [配置域名](#配置域名)
10. [常见问题](#常见问题)

---

## 准备工作

确保你已经：
- 注册了 Serv00 账号（https://serv00.com）
- 下载了项目源代码
- 安装了 SSH 客户端（Windows 可用 PuTTY 或 Windows Terminal）
- 安装了 SFTP 客户端（如 FileZilla）

---

## 登录 Serv00

### 通过 SSH 登录

```bash
ssh 你的用户名@你的服务器.serv00.com
```

首次登录需要输入密码，密码在注册邮件中。

### 通过网页面板

访问 https://panel.serv00.com 使用账号密码登录。

---

## 创建 MySQL 数据库

### 方法一：通过网页面板

1. 登录 Serv00 面板
2. 进入 **MySQL databases** 页面
3. 点击 **Add new database**
4. 填写数据库名称（如：`ane_farm`）
5. 记录数据库信息：
   - 主机：通常是 `mysql.serv00.com` 或面板显示的地址
   - 用户名：你的 Serv00 用户名
   - 密码：你设置的密码
   - 数据库名：你创建的数据库名

### 方法二：通过 SSH

```bash
# 登录 MySQL
mysql -u 你的用户名 -p

# 创建数据库（如果允许）
CREATE DATABASE ane_farm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 上传项目文件

### 方法一：使用 SFTP（推荐）

1. 打开 FileZilla
2. 连接服务器：
   - 主机：你的服务器.serv00.com
   - 用户名：你的用户名
   - 密码：你的密码
   - 端口：22
3. 将整个项目文件夹上传到 `/home/你的用户名/domains/你的域名/public_nodejs/`

### 方法二：使用 Git

```bash
# SSH 登录后
cd ~/domains/你的域名/public_nodejs
git clone 你的仓库地址 .
```

### 项目目录结构

上传后目录结构应该是：
```
public_nodejs/
├── server/
│   ├── app.js
│   ├── package.json
│   ├── db.js
│   ├── websocket.js
│   ├── database.sql
│   ├── database_friendship.sql  ← 新增：亲密度系统数据库
│   ├── .env
│   ├── middleware/
│   │   └── auth.js
│   └── routes/
│       ├── auth.js
│       ├── user.js
│       ├── station.js
│       ├── friend.js
│       ├── chat.js
│       ├── shop.js
│       ├── ranking.js
│       ├── achievement.js
│       ├── checkIn.js
│       ├── task.js
│       └── intimacy.js  ← 新增：亲密度路由
├── js/
│   ├── api-client.js  (包含 intimacyApi)
│   ├── app.js         (包含亲密度系统前端逻辑)
│   ├── config.js
│   └── storage.js
├── css/
│   ├── common.css
│   ├── pages.css      (包含亲密度相关样式)
│   └── ...
├── assets/
└── index.html         (包含好友详情和送礼弹窗)
```

### 亲密度系统新增文件清单

本次更新新增了好友亲密度系统，需要上传以下文件：

| 文件路径 | 说明 |
|---------|------|
| `server/routes/intimacy.js` | **新文件** - 亲密度系统后端 API |
| `server/database_friendship.sql` | **新文件** - 亲密度系统数据库表 |
| `server/app.js` | **已修改** - 注册了 intimacy 路由 |
| `js/api-client.js` | **已修改** - 添加了 intimacyApi 对象 |
| `js/app.js` | **已修改** - 添加了亲密度前端逻辑 |
| `css/pages.css` | **已修改** - 添加了亲密度相关样式 |
| `index.html` | **已修改** - 添加了好友详情和送礼弹窗 |

---

## 配置 Node.js 应用

### 1. 在面板中启用 Node.js

1. 登录 Serv00 面板
2. 进入 **WWW Websites** 页面
3. 添加或编辑你的网站
4. 选择 **Node.js** 作为网站类型
5. 设置以下参数：
   - **Node.js version**: 选择 18.x 或更高版本
   - **Application root**: `/home/你的用户名/domains/你的域名/public_nodejs/server`
   - **Application startup file**: `app.js`
   - **Application URL**: 你的域名

### 2. 安装依赖

通过 SSH 登录后执行：

```bash
cd ~/domains/你的域名/public_nodejs/server
npm install
```

---

## 配置环境变量

### 创建 .env 文件

```bash
cd ~/domains/你的域名/public_nodejs/server
cp .env.example .env
nano .env
```

### 编辑 .env 内容

```env
# 服务器配置
PORT=3000
NODE_ENV=production

# MySQL 数据库配置
DB_HOST=mysql.serv00.com
DB_PORT=3306
DB_USER=你的serv00用户名
DB_PASSWORD=你的数据库密码
DB_NAME=你的数据库名

# JWT 配置 - 请生成随机字符串
JWT_SECRET=请使用随机字符串至少32位_例如abc123xyz789def456
JWT_EXPIRES_IN=7d
```

生成随机 JWT_SECRET 的方法：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 初始化数据库

### 导入数据库结构

**步骤 1：导入主数据库脚本**

```bash
# 在本地或服务器执行（推荐在本地执行，使用远程连接）
mysql -h mysql.serv00.com -P 3306 -u m7732_nc -p m7732_nc < database.sql
```

**步骤 2：导入亲密度系统扩展脚本**

```bash
# 亲密度系统数据库扩展
mysql -h mysql.serv00.com -P 3306 -u m7732_nc -p m7732_nc < database_friendship.sql
```

> **说明**：
> - `-h mysql.serv00.com`：数据库服务器地址
> - `-P 3306`：MySQL 端口
> - `-u m7732_nc`：数据库用户名
> - `-p`：提示输入密码
> - `m7732_nc`：数据库名称

### 或者通过 phpMyAdmin

1. 登录 Serv00 面板
2. 进入 **phpMyAdmin**
3. 选择你的数据库
4. 点击 **Import**
5. 先上传 `database.sql` 文件并执行
6. 再上传 `database_friendship.sql` 文件并执行

---

## 启动应用

### 方法一：通过面板

1. 进入 **WWW Websites**
2. 找到你的 Node.js 应用
3. 点击 **Restart** 或 **Start**

### 方法二：通过 SSH

```bash
cd ~/domains/你的域名/public_nodejs/server

# 直接启动（测试用）
node app.js

# 使用 PM2 启动（推荐）
pm2 start app.js --name "ane-farm"
pm2 save
```

### 查看日志

```bash
# 如果使用 PM2
pm2 logs ane-farm

# 查看错误日志
pm2 logs ane-farm --err
```

---

## 配置域名

### 使用 Serv00 提供的域名

默认可以使用 `你的用户名.serv00.net` 访问。

### 使用自定义域名

1. 在域名注册商处添加 DNS 记录：
   - 类型：CNAME
   - 名称：@ 或 www
   - 值：你的用户名.serv00.net

2. 在 Serv00 面板中：
   - 进入 **WWW Websites**
   - 添加你的自定义域名
   - 等待 SSL 证书自动配置

---

## 前端配置

确保前端使用正确的 API 文件。编辑 `index.html`：

```html
<!-- 注释掉或删除旧的 api.js -->
<!-- <script src="js/api.js"></script> -->

<!-- 使用新的 API 客户端 -->
<script src="js/api-client.js"></script>
```

如果是跨域部署，编辑 `js/api-client.js`：

```javascript
const API_CONFIG = {
    baseUrl: 'https://你的域名',
    wsUrl: 'wss://你的域名/ws'
};
```

---

## 验证部署

1. 访问 `https://你的域名/api/health`，应该返回：
   ```json
   {"status":"ok","time":"..."}
   ```

2. 访问 `https://你的域名`，应该看到游戏页面

3. 尝试注册账号和登录

---

## 常见问题

### 1. 数据库连接失败

检查 `.env` 文件中的数据库配置是否正确：
- 确认数据库主机地址
- 确认用户名和密码
- 确认数据库已创建

### 2. Node.js 应用无法启动

```bash
# 查看详细错误
cd ~/domains/你的域名/public_nodejs/server
node app.js
```

常见原因：
- 缺少依赖：运行 `npm install`
- 环境变量未配置：检查 `.env` 文件
- 端口被占用：在面板中检查端口设置

### 3. WebSocket 连接失败

确保：
- Serv00 支持 WebSocket（大多数计划支持）
- 使用正确的 WebSocket URL（wss:// 或 ws://）
- 防火墙未阻止 WebSocket 连接

### 4. 502 Bad Gateway

- 检查 Node.js 应用是否正在运行
- 检查端口配置是否正确
- 查看应用日志排查错误

### 5. 静态文件 404

确保：
- 前端文件在正确的目录
- 文件权限正确（通常 644）

---

## 维护命令

```bash
# 重启应用
pm2 restart ane-farm

# 停止应用
pm2 stop ane-farm

# 查看状态
pm2 status

# 查看日志
pm2 logs ane-farm

# 更新代码后重启
cd ~/domains/你的域名/public_nodejs/server
git pull  # 如果使用 git
npm install  # 如果有新依赖
pm2 restart ane-farm
```

---

## 安全建议

1. **定期更新依赖**：
   ```bash
   npm update
   ```

2. **备份数据库**：
   ```bash
   mysqldump -u 用户名 -p 数据库名 > backup.sql
   ```

3. **监控应用状态**：
   使用 PM2 的监控功能或设置外部监控

---

如有问题，请检查服务器日志或联系 Serv00 支持。

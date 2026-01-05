# 🚀 Serv00聊天系统 - 5分钟快速启动

## 🎯 一键测试（推荐）

### Windows用户
```bash
# 双击运行
C:\Users\Administrator\Desktop\web\chat-system\quick-ssh-test.bat
```

### 或者使用Node.js
```bash
cd C:\Users\Administrator\Desktop\web\chat-system
node test-ssh-connection.js
```

---

## 📋 完整部署清单

### ✅ 第一步：准备Serv00账户（5分钟）
- [ ] 注册Serv00账户（如果还没有）
- [ ] 登录控制面板启用SSH访问
- [ ] 记录用户名、主机名、密码

### ✅ 第二步：测试SSH连接（2分钟）
```bash
# 方法1：快速测试
双击 quick-ssh-test.bat

# 方法2：详细测试
node test-ssh-connection.js
```

### ✅ 第三步：配置部署助手（3分钟）
```bash
node deploy-assistant.js
# 选择菜单 1，输入配置信息
```

### ✅ 第四步：执行完整部署（10分钟）
```bash
node deploy-assistant.js
# 选择菜单 0，按提示操作
```

---

## 🛠️ 备用方案：手动部署

### 1. 上传所有文件
```bash
# 使用SCP上传整个chat-system目录
scp -r C:\Users\Administrator\Desktop\web\chat-system\* your_username@serv00.com:~/domains/chat.yourdomain.com/app/
```

### 2. SSH登录配置
```bash
ssh your_username@serv00.com
cd ~/domains/chat.yourdomain.com/app
```

### 3. 数据库设置
```bash
# 1. 登录phpMyAdmin
# 2. 创建数据库: chat_system
# 3. 导入: database-schema.sql
# 4. 编辑 .env 文件，填入数据库信息
```

### 4. 安装依赖并启动
```bash
npm install
npm run pm2:start
```

---

## 🔧 常用命令速查

### 部署相关
```bash
# 完整部署
node deploy-assistant.js

# 连接测试
node test-ssh-connection.js

# SSH配置生成
node setup-ssh-config.js
```

### Serv00管理
```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs chat-server

# 重启应用
pm2 restart chat-server

# 停止应用
pm2 stop chat-server
```

### 数据库管理
```bash
# 登录MySQL（如果支持）
mysql -u your_db_user -p chat_system

# 查看表
SHOW TABLES;
```

---

## 🎯 部署检查点

### 部署前检查
- [ ] Serv00账户已激活
- [ ] SSH访问已启用
- [ ] 域名已配置（或使用serv00.com子域名）
- [ ] 本地文件完整（所有文件都在chat-system目录）

### 部署中检查
- [ ] SSH连接成功
- [ ] Node.js环境正常
- [ ] 目录创建成功
- [ ] 文件上传完成
- [ ] 依赖安装成功
- [ ] 数据库配置完成
- [ ] 应用启动成功

### 部署后验证
- [ ] 访问健康检查: `http://yourdomain.com:3000/health`
- [ ] 注册测试用户
- [ ] 发送测试消息
- [ ] 检查PM2状态
- [ ] 验证数据库连接

---

## 🐛 故障快速解决

### 问题1：SSH连接失败
**症状**: `Connection timed out` 或 `Permission denied`

**解决**:
1. 检查用户名和密码
2. 确认SSH在Serv00控制面板已启用
3. 尝试使用 `ssh -vvv` 查看详细错误

### 问题2：端口被占用
**症状**: `Address already in use`

**解决**:
```bash
# 查找进程
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或者使用不同端口
# 修改 .env 中的 PORT
```

### 问题3：内存不足
**症状**: `JavaScript heap out of memory`

**解决**:
1. 检查当前内存使用: `free -m`
2. 重启应用释放内存: `pm2 restart chat-server`
3. 减少并发连接数（修改代码中的限制）

### 问题4：数据库连接失败
**症状**: `ECONNREFUSED` 或 `Access denied`

**解决**:
1. 检查数据库服务状态
2. 验证 .env 中的数据库配置
3. 确认数据库用户权限
4. 通过phpMyAdmin测试连接

---

## 📊 性能监控

### 实时监控
```bash
# PM2监控
pm2 monit

# 资源使用
top -u your_username
free -m
df -h ~
```

### 日志分析
```bash
# 应用日志
pm2 logs chat-server --lines 100

# 系统日志
tail -f ~/domains/chat.yourdomain.com/logs/*.log
```

---

## 🔄 日常维护

### 每日任务
- [ ] 检查应用状态: `pm2 status`
- [ ] 查看错误日志: `pm2 logs`
- [ ] 监控资源使用

### 每周任务
- [ ] 执行备份: `npm run backup`
- [ ] 清理旧日志
- [ ] 检查用户增长

### 每月任务
- [ ] 更新依赖包: `npm update`
- [ ] 安全检查
- [ ] 性能优化

---

## 📞 获取帮助

### 文档位置
```
C:\Users\Administrator\Desktop\web\chat-system\
├── README.md                    # 项目概述
├── QUICK-START.md              # 本文件
├── SSH-SETUP-GUIDE.md          # SSH详细配置
├── deployment-guide.md         # 完整部署指南
├── api-spec.md                 # API文档
├── test-plan.md                # 测试计划
└── project-roadmap.md          # 项目路线图
```

### 关键文件
- **快速测试**: `quick-ssh-test.bat`
- **部署助手**: `deploy-assistant.js`
- **连接测试**: `test-ssh-connection.js`

---

## 🎉 成功标准

部署完成后，你应该能够：

1. ✅ 通过SSH访问Serv00
2. ✅ 访问 `http://yourdomain.com:3000/health` 返回 `{"status":"ok"}`
3. ✅ 注册新用户
4. ✅ 登录并创建房间
5. ✅ 发送和接收实时消息
6. ✅ 查看好友列表和通知

---

## ⚡ 极速模式（3分钟）

如果你已经熟悉Serv00和SSH：

```bash
# 1. 测试连接
ssh your_username@serv00.com "echo '连接成功'"

# 2. 上传文件
scp -r C:\Users\Administrator\Desktop\web\chat-system\* your_username@serv00.com:~/domains/chat.yourdomain.com/app/

# 3. 部署
ssh your_username@serv00.com "cd ~/domains/chat.yourdomain.com/app && bash quick-start.sh"
```

---

**准备好了吗？**

👉 **立即开始**: 双击 `quick-ssh-test.bat` 或运行 `node test-ssh-connection.js`

👉 **需要帮助**: 查看 `SSH-SETUP-GUIDE.md` 或 `deployment-guide.md`

👉 **完整流程**: 运行 `node deploy-assistant.js` 并选择菜单 `0`

**状态**: 🟢 所有工具已就绪，随时可以开始部署！
# Serv00 SSH配置和部署指南

## 🎯 快速开始

### 方法1: 使用部署助手（推荐）
```bash
# 运行部署助手
cd C:\Users\Administrator\Desktop\web\chat-system
node deploy-assistant.js
```

### 方法2: 使用SSH测试工具
```bash
# 测试SSH连接和环境
cd C:\Users\Administrator\Desktop\web\chat-system
node test-ssh-connection.js
```

### 方法3: 手动配置SSH
```bash
# 1. 生成SSH密钥（如果还没有）
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_serv00

# 2. 查看公钥内容
cat ~/.ssh/id_rsa_serv00.pub

# 3. 将公钥添加到Serv00控制面板
# 登录Serv00 → SSH Keys → 添加公钥

# 4. 测试连接
ssh -i ~/.ssh/id_rsa_serv00 your_username@serv00.com
```

## 🔧 SSH配置文件

创建 `~/.ssh/config` 文件：

```
Host serv00
    HostName serv00.com
    User your_username
    Port 22
    IdentityFile ~/.ssh/id_rsa_serv00
    StrictHostKeyChecking no
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

使用配置：
```bash
ssh serv00
```

## 📋 Serv00环境要求

### 必需组件
- ✅ Node.js 14+ (通常已安装)
- ✅ npm (通常已安装)
- ✅ MySQL数据库 (通过phpMyAdmin管理)
- ✅ SSH访问 (需要手动启用)

### 资源限制
- **CPU**: 10-20% 单核
- **内存**: 512MB-1GB
- **进程数**: 3-5个
- **存储**: 5-10GB
- **带宽**: 有限制

## 🚀 完整部署流程

### 步骤1: 环境测试
```bash
node test-ssh-connection.js
```

输入你的Serv00用户名和主机名，测试：
- SSH连接
- Node.js环境
- MySQL环境
- 磁盘空间
- 内存使用

### 步骤2: 配置部署助手
```bash
node deploy-assistant.js
```

选择菜单 `1` 配置连接：
- 用户名
- 主机名 (默认: serv00.com)
- 端口 (默认: 22)
- 域名 (默认: chat.yourdomain.com)

### 步骤3: 完整部署
在部署助手中选择菜单 `0` 进行完整部署：

1. ✅ 测试SSH连接
2. ✅ 检查环境 (Node.js, npm, MySQL, PM2)
3. ✅ 创建目录结构
4. ✅ 上传项目文件
5. ✅ 安装依赖
6. ✅ 数据库设置指导
7. ✅ 启动应用
8. ✅ 检查状态

## 📁 项目文件说明

### 核心文件
- `server.js` - 主服务器文件
- `ecosystem.config.js` - PM2配置
- `package.json` - 依赖配置
- `database-schema.sql` - 数据库架构

### 配置文件
- `.env.example` - 环境变量模板
- `ssh-config.txt` - SSH配置建议

### 工具脚本
- `deploy-assistant.js` - 部署助手
- `test-ssh-connection.js` - 连接测试
- `setup-ssh-config.js` - SSH配置生成
- `ssh-mcp-server.js` - MCP服务器（可选）

## 🔐 安全建议

### SSH密钥认证
1. **生成强密钥**: `ssh-keygen -t ed25519`
2. **保护私钥**: 设置强密码
3. **限制权限**: `chmod 600 ~/.ssh/id_rsa`
4. **定期轮换**: 每3-6个月更换密钥

### Serv00安全设置
1. **启用SSH**: 在控制面板手动启用
2. **限制IP**: 如果可能，限制SSH访问IP
3. **定期备份**: 设置自动备份策略
4. **监控日志**: 定期检查安全日志

## 🛠️ 故障排查

### SSH连接问题
```bash
# 详细调试模式
ssh -vvv your_username@serv00.com

# 检查SSH服务状态
# 登录Serv00控制面板 → SSH状态
```

### 常见错误

**1. "Connection timed out"**
- 检查网络连接
- 确认SSH端口开放
- 验证主机名正确

**2. "Permission denied (publickey)"**
- 确认公钥已添加到Serv00
- 检查私钥文件权限 (600)
- 验证使用正确的私钥文件

**3. "No space left on device"**
- 清理日志文件: `rm ~/domains/*/logs/*.log`
- 清理备份: `rm ~/domains/*/backups/*.gz`
- 检查磁盘使用: `df -h ~`

**4. "PM2 process died"**
- 检查内存使用: `free -m`
- 查看日志: `pm2 logs`
- 重启应用: `pm2 restart chat-server`

## 📊 监控命令

### 日常检查
```bash
# SSH登录后执行

# 查看PM2状态
pm2 status

# 查看应用日志
pm2 logs chat-server --lines 50

# 检查内存使用
free -m

# 检查磁盘空间
df -h ~

# 检查进程数
ps aux | grep node
```

### 性能监控
```bash
# 实时监控
pm2 monit

# 查看网络连接
netstat -tulpn | grep 3000

# 数据库连接数
mysql -u $DB_USER -p -e "SHOW PROCESSLIST;" chat_system
```

## 🔄 自动化维护

### 定时任务（如果支持crontab）
```bash
# 每天凌晨2点备份
0 2 * * * cd ~/domains/chat.yourdomain.com/app && npm run backup

# 每小时监控
0 * * * * cd ~/domains/chat.yourdomain.com/app && npm run monitor
```

### 备份脚本
```bash
# 手动备份
cd ~/domains/chat.yourdomain.com/app
npm run backup

# 查看备份
ls -la ~/domains/chat.yourdomain.com/backups/
```

## 📞 获取帮助

### 文档资源
- 项目根目录: `C:\Users\Administrator\Desktop\web\chat-system\`
- 详细部署: `deployment-guide.md`
- API文档: `api-spec.md`
- 测试计划: `test-plan.md`

### 关键命令速查
```bash
# 部署助手
node deploy-assistant.js

# 连接测试
node test-ssh-connection.js

# SSH配置生成
node setup-ssh-config.js

# 健康检查
curl http://yourdomain.com:3000/health
```

---

**状态**: 🟢 准备就绪
**下一步**: 运行 `node test-ssh-connection.js` 开始测试
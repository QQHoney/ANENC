# Serv00 部署指南

## 快速部署（推荐）

### 方法1：使用部署脚本（最简单）

1. **修改脚本配置**
   ```bash
   # 编辑 deploy.sh
   # 修改 REMOTE_USER 为你的 Serv00 用户名
   REMOTE_USER="你的用户名"
   ```

2. **配置 SSH 密钥（如果还没有）**
   ```bash
   # 本地生成密钥
   ssh-keygen -t rsa -b 4096

   # 复制公钥到 Serv00
   ssh-copy-id 你的用户名@serv00.com
   ```

3. **运行部署脚本**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh 你的用户名
   ```

4. **访问游戏**
   ```
   http://你的用户名.serv00.com/annengnongchang/
   ```

### 方法2：手动上传

#### 步骤1：压缩文件
```bash
# 进入 web 目录
cd web

# 创建压缩包
zip -r annengnongchang.zip . -x "*.md" "deploy.sh"
```

#### 步骤2：上传到 Serv00

**使用 SCP：**
```bash
scp annengnongchang.zip 你的用户名@serv00.com:~/public_html/
```

**使用 FTP 客户端：**
- 主机：serv00.com
- 用户名：你的用户名
- 密码：你的密码
- 目标目录：/public_html/

#### 步骤3：解压并设置权限

```bash
# SSH 登录 Serv00
ssh 你的用户名@serv00.com

# 进入 web 目录
cd ~/public_html

# 创建目录
mkdir annengnongchang
cd annengnongchang

# 解压
unzip ../annengnongchang.zip

# 设置权限
chmod -R 755 .

# 清理
rm ../annengnongchang.zip
```

### 方法3：使用 Serv00 文件管理器

1. 登录 Serv00 控制面板
2. 打开 **文件管理器**
3. 导航到 `public_html`
4. 点击 **新建文件夹**，命名为 `annengnongchang`
5. 进入该文件夹
6. 点击 **上传文件**，选择所有 web 目录下的文件
7. 上传完成后，选中所有文件，点击 **权限**，设置为 755

## 访问地址

部署完成后，通过以下地址访问：

```
http://你的用户名.serv00.com/annengnongchang/
```

例如，如果你的用户名是 `zhangsan`：
```
http://zhangsan.serv00.com/annengnongchang/
```

## 验证部署

访问后应该看到：
1. 加载页面（带进度条）
2. 登录页面
3. 可以开始游戏

如果看到 403 错误：
- 检查文件权限是否为 755
- 检查 .htaccess 文件是否存在
- 确认文件上传完整

## 更新部署

### 使用脚本更新
```bash
./deploy.sh 你的用户名
```

### 手动更新
1. 删除旧文件：`rm -rf ~/public_html/annengnongchang/*`
2. 重新上传所有文件
3. 设置权限：`chmod -R 755 ~/public_html/annengnongchang/`

## 故障排除

### 问题1：页面显示 403 Forbidden
**解决方案：**
```bash
chmod 755 ~/public_html/annengnongchang/
chmod 644 ~/public_html/annengnongchang/*.html
chmod 644 ~/public_html/annengnongchang/css/*
chmod 644 ~/public_html/annengnongchang/js/*
chmod 644 ~/public_html/annengnongchang/assets/*
```

### 问题2：CSS/JS 文件不加载
**解决方案：**
- 检查文件路径是否正确
- 检查文件权限
- 清除浏览器缓存

### 问题3：游戏数据不保存
**解决方案：**
- 检查浏览器是否启用 localStorage
- 尝试使用隐身模式测试
- 检查浏览器控制台是否有错误

### 问题4：图标不显示
**解决方案：**
- 确保 assets 目录已上传
- 检查 SVG 文件权限（644）
- 检查 .htaccess 是否正确配置 MIME 类型

## 性能优化

### 启用 Gzip 压缩
Serv00 默认已启用，如果需要手动配置：
```bash
# 在 .htaccess 中确保有：
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>
```

### 设置缓存
```bash
# 在 .htaccess 中：
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 week"
    ExpiresByType application/javascript "access plus 1 week"
    ExpiresByType image/svg+xml "access plus 1 month"
</IfModule>
```

## 安全建议

1. **不要修改默认权限**：保持 755（目录）和 644（文件）
2. **不要上传敏感信息**：游戏数据在浏览器本地
3. **定期备份**：如果需要保存游戏进度，手动导出 localStorage

## 技术支持

如果遇到问题，请检查：
1. ✅ 文件是否完整上传
2. ✅ 权限是否正确（755/644）
3. ✅ 浏览器控制台是否有错误
4. ✅ 网络连接是否正常

## 开发调试

### 本地测试
直接在浏览器打开 `index.html` 即可

### 查看错误
按 F12 打开开发者工具，查看 Console 和 Network 标签

### 清除数据
如果需要重置游戏，在浏览器控制台运行：
```javascript
localStorage.clear();
location.reload();
```

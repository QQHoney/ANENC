@echo off
chcp 65001 >nul
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║          Serv00 SSH 连接测试工具                          ║
echo ║          无需MCP，直接测试SSH连接                         ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

set /p username=请输入Serv00用户名:
set /p host=请输入主机名 [默认: serv00.com]:
if "%host%"=="" set host=serv00.com
set /p port=请输入端口 [默认: 22]:
if "%port%"=="" set port=22

echo.
echo [1/5] 测试SSH连接...
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p %port% %username%@%host% "echo ✅ 连接成功" 2>nul
if %errorlevel% equ 0 (
    echo ✅ SSH连接测试通过
) else (
    echo ❌ SSH连接失败，请检查：
    echo    - 用户名和密码是否正确
    echo    - SSH端口是否开放
    echo    - 网络连接是否正常
    echo    - 是否已启用SSH访问
    goto :end
)

echo.
echo [2/5] 检查Node.js环境...
ssh -o StrictHostKeyChecking=no -p %port% %username%@%host% "node --version 2>/dev/null && npm --version 2>/dev/null" 2>nul
if %errorlevel% equ 0 (
    echo ✅ Node.js环境正常
) else (
    echo ⚠️  Node.js环境检查失败
)

echo.
echo [3/5] 检查MySQL环境...
ssh -o StrictHostKeyChecking=no -p %port% %username%@%host% "mysql --version 2>/dev/null || echo '未安装'" 2>nul
echo ✅ MySQL环境检查完成

echo.
echo [4/5] 检查磁盘空间...
ssh -o StrictHostKeyChecking=no -p %port% %username%@%host% "df -h ~ | tail -1" 2>nul
echo ✅ 磁盘空间检查完成

echo.
echo [5/5] 创建项目目录...
ssh -o StrictHostKeyChecking=no -p %port% %username%@%host% "mkdir -p ~/domains/chat.yourdomain.com/{app,public_html,logs,backups}" 2>nul
if %errorlevel% equ 0 (
    echo ✅ 目录创建成功
) else (
    echo ❌ 目录创建失败
)

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                    测试完成                                ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 📋 SSH配置建议:
echo.
echo Host serv00
echo     HostName %host%
echo     User %username%
echo     Port %port%
echo     IdentityFile ~/.ssh/id_rsa
echo     StrictHostKeyChecking no
echo     ServerAliveInterval 60
echo.
echo 🚀 下一步:
echo 1. 将上述配置添加到 ~/.ssh/config
echo 2. 运行: node deploy-assistant.js
echo 3. 选择菜单 1 配置连接
echo 4. 选择菜单 0 开始完整部署
echo.

:end
pause
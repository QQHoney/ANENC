#!/bin/bash
# Serv00 部署脚本

# 配置
REMOTE_USER="your_username"  # 修改为你的 Serv00 用户名
REMOTE_HOST="serv00.com"     # Serv00 主机地址
REMOTE_DIR="~/public_html/annengnongchang"  # 远程目录

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== 安能物流农场 - Serv00 部署脚本 ===${NC}"
echo ""

# 检查参数
if [ "$1" = "" ]; then
    echo -e "${RED}错误: 请提供 Serv00 用户名${NC}"
    echo "用法: ./deploy.sh <你的用户名>"
    echo "示例: ./deploy.sh zhangsan"
    exit 1
fi

REMOTE_USER=$1

# 检查是否安装了 rsync
if ! command -v rsync &> /dev/null; then
    echo -e "${RED}错误: 未安装 rsync${NC}"
    echo "请安装 rsync: apt-get install rsync (Debian/Ubuntu) 或 yum install rsync (CentOS)"
    exit 1
fi

echo -e "${GREEN}步骤 1: 测试 SSH 连接...${NC}"
ssh -o BatchMode=yes -o ConnectTimeout=5 ${REMOTE_USER}@${REMOTE_HOST} "echo 'SSH 连接成功'" || {
    echo -e "${RED}错误: 无法连接到 Serv00${NC}"
    echo "请检查:"
    echo "1. 用户名是否正确"
    echo "2. 是否已配置 SSH 密钥"
    echo "3. 网络连接是否正常"
    exit 1
}

echo -e "${GREEN}步骤 2: 创建远程目录...${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} "mkdir -p ${REMOTE_DIR}"

echo -e "${GREEN}步骤 3: 上传文件...${NC}"
echo "正在同步文件到 Serv00..."
rsync -avz --progress --exclude='.git' --exclude='*.md' --exclude='deploy.sh' \
    ./ ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/

echo -e "${GREEN}步骤 4: 设置权限...${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} "chmod -R 755 ${REMOTE_DIR}"

echo ""
echo -e "${GREEN}=== 部署完成！ ===${NC}"
echo ""
echo -e "游戏地址: ${YELLOW}http://${REMOTE_USER}.serv00.com/annengnongchang/${NC}"
echo ""
echo -e "${GREEN}提示:${NC}"
echo "1. 首次访问时，浏览器可能会提示允许本地存储"
echo "2. 游戏数据保存在浏览器中，不同浏览器数据不互通"
echo "3. 如需更新，重新运行此脚本即可"
echo ""
echo -e "${YELLOW}注意事项:${NC}"
echo "1. 请将本脚本中的 REMOTE_USER 改为你的实际用户名"
echo "2. 确保已配置 SSH 密钥免密登录"
echo "3. 如果没有配置 SSH 密钥，可以使用密码登录"
echo ""

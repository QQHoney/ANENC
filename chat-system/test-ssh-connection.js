#!/usr/bin/env node
/**
 * SSH连接测试脚本
 * 用于测试Serv00 SSH连接，不依赖MCP
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const readline = require('readline');

const execAsync = promisify(exec);

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

// 验证SSH命令
async function validateSSHCommand() {
  try {
    await execAsync('ssh -V');
    return true;
  } catch (error) {
    log(colors.red, '❌ 未找到SSH命令，请安装OpenSSH');
    return false;
  }
}

// 测试基本连接
async function testBasicConnection(username, host, port = 22) {
  log(colors.blue, `🔍 测试基本连接: ${username}@${host}:${port}`);

  try {
    const cmd = `ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p ${port} ${username}@${host} "echo 'success'"`;
    const { stdout } = await execAsync(cmd);

    if (stdout.includes('success')) {
      log(colors.green, '✅ 基本连接测试通过');
      return true;
    } else {
      log(colors.red, '❌ 基本连接测试失败');
      return false;
    }
  } catch (error) {
    log(colors.red, `❌ 连接失败: ${error.message}`);
    return false;
  }
}

// 检查Node.js环境
async function checkNodeEnvironment(username, host, port = 22) {
  log(colors.blue, '🔍 检查Node.js环境...');

  try {
    const cmd = `ssh -o StrictHostKeyChecking=no -p ${port} ${username}@${host} "node --version 2>/dev/null && npm --version 2>/dev/null"`;
    const { stdout } = await execAsync(cmd);
    const versions = stdout.trim().split('\n');

    log(colors.green, `✅ Node.js: ${versions[0] || '未安装'}, npm: ${versions[1] || '未安装'}`);
    return true;
  } catch (error) {
    log(colors.yellow, '⚠️ Node.js环境检查失败');
    return false;
  }
}

// 检查MySQL环境
async function checkMySQLEnvironment(username, host, port = 22) {
  log(colors.blue, '🔍 检查MySQL环境...');

  try {
    const cmd = `ssh -o StrictHostKeyChecking=no -p ${port} ${username}@${host} "mysql --version 2>/dev/null || echo '未安装'"`;
    const { stdout } = await execAsync(cmd);

    if (stdout.includes('未安装')) {
      log(colors.yellow, '⚠️ MySQL客户端未安装，但phpMyAdmin可能可用');
    } else {
      log(colors.green, `✅ MySQL: ${stdout.trim()}`);
    }
    return true;
  } catch (error) {
    log(colors.yellow, '⚠️ MySQL环境检查失败');
    return false;
  }
}

// 检查磁盘空间
async function checkDiskSpace(username, host, port = 22) {
  log(colors.blue, '🔍 检查磁盘空间...');

  try {
    const cmd = `ssh -o StrictHostKeyChecking=no -p ${port} ${username}@${host} "df -h ~ | tail -1"`;
    const { stdout } = await execAsync(cmd);

    const parts = stdout.trim().split(/\s+/);
    const used = parts[2];
    const available = parts[3];
    const percent = parts[4];

    log(colors.green, `✅ 磁盘使用: ${used}已用, ${available}可用 (${percent})`);
    return true;
  } catch (error) {
    log(colors.yellow, '⚠️ 磁盘空间检查失败');
    return false;
  }
}

// 检查内存
async function checkMemory(username, host, port = 22) {
  log(colors.blue, '🔍 检查内存...');

  try {
    const cmd = `ssh -o StrictHostKeyChecking=no -p ${port} ${username}@${host} "free -m | grep Mem"`;
    const { stdout } = await execAsync(cmd);

    const parts = stdout.trim().split(/\s+/);
    const total = parts[1];
    const used = parts[2];
    const available = parts[6];

    log(colors.green, `✅ 内存: 总共${total}MB, 已用${used}MB, 可用${available}MB`);
    return true;
  } catch (error) {
    log(colors.yellow, '⚠️ 内存检查失败');
    return false;
  }
}

// 检查目录结构
async function checkDirectoryStructure(username, host, port = 22) {
  log(colors.blue, '🔍 检查目录结构...');

  try {
    const cmd = `ssh -o StrictHostKeyChecking=no -p ${port} ${username}@${host} "mkdir -p ~/domains/chat.yourdomain.com/{app,public_html,logs,backups} && ls -la ~/domains/"`;
    const { stdout } = await execAsync(cmd);

    log(colors.green, '✅ 目录结构创建成功');
    console.log(stdout);
    return true;
  } catch (error) {
    log(colors.red, '❌ 目录结构检查失败');
    return false;
  }
}

// 生成SSH配置建议
function generateSSHConfig(username, host, port = 22) {
  log(colors.cyan, '\n📋 SSH配置建议:');
  console.log('');
  console.log(`Host serv00`);
  console.log(`    HostName ${host}`);
  console.log(`    User ${username}`);
  console.log(`    Port ${port}`);
  console.log(`    IdentityFile ~/.ssh/id_rsa`);
  console.log(`    StrictHostKeyChecking no`);
  console.log(`    ServerAliveInterval 60`);
  console.log(`    ServerAliveCountMax 3`);
  console.log('');
  log(colors.cyan, '将此配置添加到 ~/.ssh/config 文件');
}

// 主函数
async function main() {
  log(colors.cyan, '🚀 Serv00 SSH连接测试工具\n');

  // 检查SSH命令
  if (!await validateSSHCommand()) {
    process.exit(1);
  }

  // 获取用户输入
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (text) => new Promise(resolve => rl.question(text, resolve));

  try {
    const username = await question('请输入Serv00用户名: ');
    const host = await question('请输入主机名 (默认: serv00.com): ') || 'serv00.com';
    const port = parseInt(await question('请输入SSH端口 (默认: 22): ') || '22');

    rl.close();

    log(colors.cyan, `\n开始测试 ${username}@${host}:${port}\n`);

    // 运行所有测试
    const tests = [
      () => testBasicConnection(username, host, port),
      () => checkNodeEnvironment(username, host, port),
      () => checkMySQLEnvironment(username, host, port),
      () => checkDiskSpace(username, host, port),
      () => checkMemory(username, host, port),
      () => checkDirectoryStructure(username, host, port)
    ];

    let passed = 0;
    for (const test of tests) {
      if (await test()) {
        passed++;
      }
      console.log('');
    }

    // 总结
    log(colors.cyan, '📊 测试总结:');
    log(colors.green, `通过: ${passed}/${tests.length}`);

    if (passed === tests.length) {
      log(colors.green, '🎉 所有测试通过！Serv00环境准备就绪。');
      generateSSHConfig(username, host, port);

      log(colors.cyan, '\n🚀 下一步:');
      log(colors.reset, '1. 配置SSH密钥认证 (推荐)');
      log(colors.reset, '2. 在Claude中使用SSH MCP工具');
      log(colors.reset, '3. 开始部署聊天系统');
    } else {
      log(colors.yellow, '⚠️ 部分测试未通过，请检查配置');
    }

  } catch (error) {
    rl.close();
    log(colors.red, `❌ 错误: ${error.message}`);
    process.exit(1);
  }
}

// 运行
if (require.main === module) {
  main().catch(error => {
    log(colors.red, `❌ 程序异常: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  testBasicConnection,
  checkNodeEnvironment,
  checkMySQLEnvironment,
  checkDiskSpace,
  checkMemory,
  checkDirectoryStructure
};
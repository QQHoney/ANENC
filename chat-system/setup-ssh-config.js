/**
 * Serv00 SSH配置助手
 * 用于生成SSH配置和测试连接
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// 配置模板
const sshConfigTemplate = (username, host, port = 22) => `# Serv00 SSH配置
Host serv00
    HostName ${host}
    User ${username}
    Port ${port}
    IdentityFile ~/.ssh/id_rsa
    StrictHostKeyChecking no
    ServerAliveInterval 60
    ServerAliveCountMax 3
`;

// 生成配置文件
async function generateSSHConfig() {
  console.log('🔧 Serv00 SSH配置生成器\n');

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (text) => new Promise(resolve => readline.question(text, resolve));

  try {
    const username = await question('请输入Serv00用户名: ');
    const host = await question('请输入Serv00主机名 (默认: serv00.com): ') || 'serv00.com';
    const port = await question('请输入SSH端口 (默认: 22): ') || '22';

    readline.close();

    // 生成配置
    const config = sshConfigTemplate(username, host, port);

    // 保存到项目目录
    const configPath = path.join(__dirname, 'ssh-config.txt');
    fs.writeFileSync(configPath, config);

    console.log('\n✅ SSH配置已生成:');
    console.log('📁 保存位置:', configPath);
    console.log('\n📄 配置内容:');
    console.log(config);

    console.log('\n📋 下一步操作:');
    console.log('1. 将上述配置添加到 ~/.ssh/config 文件中');
    console.log('2. 生成SSH密钥对 (如果还没有): ssh-keygen -t rsa -b 4096');
    console.log('3. 将公钥添加到Serv00控制面板');
    console.log('4. 测试连接: ssh serv00');

    return { username, host, port };

  } catch (error) {
    console.error('❌ 配置生成失败:', error.message);
    readline.close();
    process.exit(1);
  }
}

// 测试SSH连接
async function testSSHConnection(config) {
  console.log('\n🔍 测试SSH连接...\n');

  try {
    const cmd = `ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p ${config.port} ${config.username}@${config.host} "echo '连接成功！'"`;
    const { stdout, stderr } = await execAsync(cmd);

    console.log('✅ SSH连接测试成功！');
    console.log('输出:', stdout.trim());

    if (stderr) {
      console.log('警告:', stderr.trim());
    }

    return true;
  } catch (error) {
    console.log('❌ SSH连接测试失败');
    console.log('错误:', error.message);

    console.log('\n💡 常见问题解决:');
    console.log('1. 检查用户名和密码是否正确');
    console.log('2. 确保SSH端口已开放');
    console.log('3. 如果使用密钥认证，请确保:');
    console.log('   - 私钥文件存在且权限正确');
    console.log('   - 公钥已添加到Serv00控制面板');
    console.log('4. 检查网络连接是否正常');

    return false;
  }
}

// 检查Serv00环境
async function checkServ00Environment(config) {
  console.log('\n🔍 检查Serv00环境...\n');

  try {
    const commands = [
      { name: 'Node.js', cmd: 'node --version' },
      { name: 'npm', cmd: 'npm --version' },
      { name: 'MySQL客户端', cmd: 'mysql --version 2>/dev/null || echo "未安装"' },
      { name: 'PM2', cmd: 'pm2 --version 2>/dev/null || echo "未安装"' },
      { name: 'Git', cmd: 'git --version' },
      { name: '磁盘空间', cmd: 'df -h ~ | tail -1' },
      { name: '内存使用', cmd: 'free -m | grep Mem' }
    ];

    for (const { name, cmd } of commands) {
      const fullCmd = `ssh -o StrictHostKeyChecking=no -p ${config.port} ${config.username}@${config.host} "${cmd}"`;
      try {
        const { stdout } = await execAsync(fullCmd);
        console.log(`✅ ${name}: ${stdout.trim()}`);
      } catch (error) {
        console.log(`❌ ${name}: 检查失败`);
      }
    }

    console.log('\n💡 环境检查完成！');
    return true;
  } catch (error) {
    console.log('❌ 环境检查失败:', error.message);
    return false;
  }
}

// 主函数
async function main() {
  console.log('🚀 Serv00 SSH配置助手\n');

  const config = await generateSSHConfig();

  const connected = await testSSHConnection(config);

  if (connected) {
    await checkServ00Environment(config);

    console.log('\n🎉 配置完成！现在可以使用SSH MCP工具进行部署了。');
    console.log('\n在Claude Code中使用以下命令:');
    console.log('1. configure_ssh - 配置连接');
    console.log('2. test_ssh_connection - 测试连接');
    console.log('3. serv00_deploy - 检查部署环境');
  } else {
    console.log('\n⚠️ 请先解决SSH连接问题，然后重试。');
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateSSHConfig, testSSHConnection, checkServ00Environment };
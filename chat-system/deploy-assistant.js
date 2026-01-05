#!/usr/bin/env node
/**
 * Serv00部署助手
 * 提供简单的命令行界面来管理Serv00部署
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

// 颜色
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

// 配置管理
class ConfigManager {
  constructor() {
    this.configFile = path.join(__dirname, 'serv00-config.json');
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configFile)) {
        return JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
      }
    } catch (error) {
      console.error('配置加载失败:', error.message);
    }
    return null;
  }

  saveConfig(config) {
    try {
      fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
      this.config = config;
      return true;
    } catch (error) {
      console.error('配置保存失败:', error.message);
      return false;
    }
  }

  getConfig() {
    return this.config;
  }

  hasConfig() {
    return this.config !== null;
  }
}

// SSH管理器
class SSHManager {
  constructor(config) {
    this.config = config;
  }

  async testConnection() {
    try {
      const cmd = `ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p ${this.config.port} ${this.config.username}@${this.config.host} "echo '连接成功'"`;
      const { stdout } = await execAsync(cmd);
      return stdout.includes('连接成功');
    } catch (error) {
      return false;
    }
  }

  async executeCommand(command, timeout = 30000) {
    try {
      const cmd = `ssh -o StrictHostKeyChecking=no -p ${this.config.port} ${this.config.username}@${this.config.host} "${command.replace(/"/g, '\\"')}"`;
      const { stdout, stderr } = await execAsync(cmd, { timeout });
      return { success: true, stdout, stderr };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async uploadFile(localPath, remotePath) {
    try {
      const cmd = `scp -o StrictHostKeyChecking=no -P ${this.config.port} "${localPath}" ${this.config.username}@${this.config.host}:"${remotePath}"`;
      await execAsync(cmd, { timeout: 60000 });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async uploadDirectory(localDir, remoteDir) {
    try {
      const cmd = `scp -o StrictHostKeyChecking=no -P ${this.config.port} -r "${localDir}" ${this.config.username}@${this.config.host}:"${remoteDir}"`;
      await execAsync(cmd, { timeout: 120000 });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// 部署管理器
class DeployManager {
  constructor(ssh) {
    this.ssh = ssh;
  }

  async checkEnvironment() {
    log(colors.blue, '🔍 检查Serv00环境...');

    const checks = [
      { name: 'Node.js', cmd: 'node --version 2>/dev/null || echo "未安装"' },
      { name: 'npm', cmd: 'npm --version 2>/dev/null || echo "未安装"' },
      { name: 'MySQL', cmd: 'mysql --version 2>/dev/null || echo "未安装"' },
      { name: 'PM2', cmd: 'pm2 --version 2>/dev/null || echo "未安装"' },
      { name: 'Git', cmd: 'git --version 2>/dev/null || echo "未安装"' }
    ];

    for (const check of checks) {
      const result = await this.ssh.executeCommand(check.cmd);
      if (result.success) {
        const version = result.stdout.trim();
        if (version.includes('未安装')) {
          log(colors.yellow, `⚠️ ${check.name}: ${version}`);
        } else {
          log(colors.green, `✅ ${check.name}: ${version}`);
        }
      } else {
        log(colors.red, `❌ ${check.name}: 检查失败`);
      }
    }
  }

  async setupDirectories() {
    log(colors.blue, '📁 创建目录结构...');

    const baseDir = `~/domains/${this.ssh.config.domain || 'chat.yourdomain.com'}`;
    const dirs = [
      `${baseDir}/app`,
      `${baseDir}/public_html`,
      `${baseDir}/logs`,
      `${baseDir}/backups`
    ];

    const cmd = `mkdir -p ${dirs.join(' ')}`;
    const result = await this.ssh.executeCommand(cmd);

    if (result.success) {
      log(colors.green, '✅ 目录创建成功');
      return baseDir;
    } else {
      log(colors.red, `❌ 目录创建失败: ${result.error}`);
      return null;
    }
  }

  async uploadProject(localProjectDir, remoteBaseDir) {
    log(colors.blue, '📤 上传项目文件...');

    const appDir = `${remoteBaseDir}/app`;

    // 上传主要文件
    const filesToUpload = [
      'package.json',
      'server.js',
      'ecosystem.config.js',
      'database-schema.sql',
      '.env.example'
    ];

    for (const file of filesToUpload) {
      const localPath = path.join(localProjectDir, file);
      if (fs.existsSync(localPath)) {
        const result = await this.ssh.uploadFile(localPath, appDir);
        if (result.success) {
          log(colors.green, `✅ 上传: ${file}`);
        } else {
          log(colors.red, `❌ 失败: ${file} - ${result.error}`);
        }
      } else {
        log(colors.yellow, `⚠️ 跳过: ${file} (不存在)`);
      }
    }

    // 上传目录
    const dirsToUpload = ['config', 'controllers', 'models', 'routes', 'middleware', 'utils', 'scripts', 'public'];
    for (const dir of dirsToUpload) {
      const localPath = path.join(localProjectDir, dir);
      if (fs.existsSync(localPath)) {
        const result = await this.ssh.uploadDirectory(localPath, `${appDir}/${dir}`);
        if (result.success) {
          log(colors.green, `✅ 上传目录: ${dir}`);
        } else {
          log(colors.red, `❌ 目录失败: ${dir} - ${result.error}`);
        }
      } else {
        log(colors.yellow, `⚠️ 跳过目录: ${dir} (不存在)`);
      }
    }
  }

  async installDependencies(remoteBaseDir) {
    log(colors.blue, '📦 安装依赖...');

    const appDir = `${remoteBaseDir}/app`;
    const result = await this.ssh.executeCommand(`cd ${appDir} && npm install --production`, 300000);

    if (result.success) {
      log(colors.green, '✅ 依赖安装完成');
      return true;
    } else {
      log(colors.red, `❌ 依赖安装失败: ${result.error}`);
      return false;
    }
  }

  async setupDatabase() {
    log(colors.blue, '🗄️ 数据库设置...');

    log(colors.yellow, '⚠️ 请手动完成以下步骤:');
    log(colors.reset, '1. 登录phpMyAdmin');
    log(colors.reset, '2. 创建数据库: chat_system');
    log(colors.reset, '3. 导入 database-schema.sql');
    log(colors.reset, '4. 更新 .env 文件中的数据库配置');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question('\n完成数据库设置后按回车继续...', resolve);
    });
    rl.close();

    log(colors.green, '✅ 数据库设置完成');
  }

  async startApplication(remoteBaseDir) {
    log(colors.blue, '🚀 启动应用...');

    const appDir = `${remoteBaseDir}/app`;
    const result = await this.ssh.executeCommand(`cd ${appDir} && npm run pm2:start`);

    if (result.success) {
      log(colors.green, '✅ 应用启动成功');
      log(colors.reset, 'PM2状态:', result.stdout);
      return true;
    } else {
      log(colors.red, `❌ 启动失败: ${result.error}`);
      return false;
    }
  }

  async checkStatus(remoteBaseDir) {
    log(colors.blue, '📊 检查应用状态...');

    const appDir = `${remoteBaseDir}/app`;
    const result = await this.ssh.executeCommand(`cd ${appDir} && pm2 status`);

    if (result.success) {
      log(colors.green, '✅ PM2状态:');
      console.log(result.stdout);
    } else {
      log(colors.red, '❌ 无法获取状态');
    }
  }
}

// 交互式菜单
async function showMenu() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (text) => new Promise(resolve => rl.question(text, resolve));

  while (true) {
    console.log('\n' + colors.cyan + '=== Serv00 部署助手 ===' + colors.reset);
    console.log('1. 配置Serv00连接');
    console.log('2. 测试SSH连接');
    console.log('3. 检查环境');
    console.log('4. 设置目录结构');
    console.log('5. 上传项目文件');
    console.log('6. 安装依赖');
    console.log('7. 数据库设置');
    console.log('8. 启动应用');
    console.log('9. 检查状态');
    console.log('0. 完整部署流程');
    console.log('q. 退出');

    const choice = await question('\n请选择操作: ');

    if (choice === 'q') {
      rl.close();
      break;
    }

    await handleChoice(choice, rl);
  }
}

async function handleChoice(choice, rl) {
  const configManager = new ConfigManager();

  switch (choice) {
    case '1':
      const config = {
        username: await question(rl, '用户名: '),
        host: await question(rl, '主机名 (默认: serv00.com): ') || 'serv00.com',
        port: parseInt(await question(rl, '端口 (默认: 22): ') || '22'),
        domain: await question(rl, '域名 (默认: chat.yourdomain.com): ') || 'chat.yourdomain.com'
      };
      if (configManager.saveConfig(config)) {
        log(colors.green, '✅ 配置已保存');
      } else {
        log(colors.red, '❌ 保存失败');
      }
      break;

    case '2':
      if (!configManager.hasConfig()) {
        log(colors.red, '❌ 请先配置连接');
        return;
      }
      const ssh = new SSHManager(configManager.getConfig());
      const connected = await ssh.testConnection();
      if (connected) {
        log(colors.green, '✅ 连接成功');
      } else {
        log(colors.red, '❌ 连接失败');
      }
      break;

    case '3':
      if (!configManager.hasConfig()) {
        log(colors.red, '❌ 请先配置连接');
        return;
      }
      const ssh3 = new SSHManager(configManager.getConfig());
      const deploy3 = new DeployManager(ssh3);
      await deploy3.checkEnvironment();
      break;

    case '4':
      if (!configManager.hasConfig()) {
        log(colors.red, '❌ 请先配置连接');
        return;
      }
      const ssh4 = new SSHManager(configManager.getConfig());
      const deploy4 = new DeployManager(ssh4);
      await deploy4.setupDirectories();
      break;

    case '5':
      if (!configManager.hasConfig()) {
        log(colors.red, '❌ 请先配置连接');
        return;
      }
      const localDir = await question(rl, '本地项目目录: ') || __dirname;
      const ssh5 = new SSHManager(configManager.getConfig());
      const deploy5 = new DeployManager(ssh5);
      const baseDir = `~/domains/${ssh5.config.domain}/app`;
      await deploy5.uploadProject(localDir, baseDir);
      break;

    case '6':
      if (!configManager.hasConfig()) {
        log(colors.red, '❌ 请先配置连接');
        return;
      }
      const ssh6 = new SSHManager(configManager.getConfig());
      const deploy6 = new DeployManager(ssh6);
      const baseDir6 = `~/domains/${ssh6.config.domain}`;
      await deploy6.installDependencies(baseDir6);
      break;

    case '7':
      if (!configManager.hasConfig()) {
        log(colors.red, '❌ 请先配置连接');
        return;
      }
      const ssh7 = new SSHManager(configManager.getConfig());
      const deploy7 = new DeployManager(ssh7);
      await deploy7.setupDatabase();
      break;

    case '8':
      if (!configManager.hasConfig()) {
        log(colors.red, '❌ 请先配置连接');
        return;
      }
      const ssh8 = new SSHManager(configManager.getConfig());
      const deploy8 = new DeployManager(ssh8);
      const baseDir8 = `~/domains/${ssh8.config.domain}`;
      await deploy8.startApplication(baseDir8);
      break;

    case '9':
      if (!configManager.hasConfig()) {
        log(colors.red, '❌ 请先配置连接');
        return;
      }
      const ssh9 = new SSHManager(configManager.getConfig());
      const deploy9 = new DeployManager(ssh9);
      const baseDir9 = `~/domains/${ssh9.config.domain}`;
      await deploy9.checkStatus(baseDir9);
      break;

    case '0':
      await runFullDeploy(rl, configManager);
      break;

    default:
      log(colors.yellow, '⚠️ 无效选择');
  }
}

async function runFullDeploy(rl, configManager) {
  log(colors.cyan, '🚀 开始完整部署流程...\n');

  if (!configManager.hasConfig()) {
    log(colors.red, '❌ 请先配置连接 (选择菜单1)');
    return;
  }

  const ssh = new SSHManager(configManager.getConfig());
  const deploy = new DeployManager(ssh);

  // 1. 测试连接
  log(colors.blue, '步骤1: 测试SSH连接');
  if (!await ssh.testConnection()) {
    log(colors.red, '❌ 连接失败，终止部署');
    return;
  }
  log(colors.green, '✅ 连接成功\n');

  // 2. 检查环境
  log(colors.blue, '步骤2: 检查环境');
  await deploy.checkEnvironment();
  console.log('');

  // 3. 设置目录
  log(colors.blue, '步骤3: 设置目录');
  const baseDir = await deploy.setupDirectories();
  if (!baseDir) {
    log(colors.red, '❌ 目录设置失败，终止部署');
    return;
  }
  console.log('');

  // 4. 上传文件
  log(colors.blue, '步骤4: 上传项目文件');
  const localDir = await question(rl, `本地项目目录 (默认: ${__dirname}): `) || __dirname;
  await deploy.uploadProject(localDir, baseDir);
  console.log('');

  // 5. 安装依赖
  log(colors.blue, '步骤5: 安装依赖');
  const continueInstall = await question(rl, '是否安装依赖? (y/n): ');
  if (continueInstall.toLowerCase() === 'y') {
    await deploy.installDependencies(baseDir);
  }
  console.log('');

  // 6. 数据库设置
  log(colors.blue, '步骤6: 数据库设置');
  await deploy.setupDatabase();
  console.log('');

  // 7. 启动应用
  log(colors.blue, '步骤7: 启动应用');
  const continueStart = await question(rl, '是否启动应用? (y/n): ');
  if (continueStart.toLowerCase() === 'y') {
    await deploy.startApplication(baseDir);
  }
  console.log('');

  // 8. 检查状态
  log(colors.blue, '步骤8: 检查状态');
  await deploy.checkStatus(baseDir);

  log(colors.green, '\n🎉 部署流程完成！');
}

function question(rl, text) {
  return new Promise(resolve => rl.question(text, resolve));
}

// 主函数
async function main() {
  const configManager = new ConfigManager();

  if (!configManager.hasConfig()) {
    log(colors.yellow, '⚠️ 未检测到配置，请先进行配置');
  } else {
    log(colors.green, '✅ 已加载现有配置');
  }

  await showMenu();
}

// 运行
if (require.main === module) {
  main().catch(error => {
    log(colors.red, `❌ 错误: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  ConfigManager,
  SSHManager,
  DeployManager
};
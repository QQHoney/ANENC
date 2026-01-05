#!/usr/bin/env node
/**
 * SSH MCP服务器 - 用于连接Serv00服务器
 * 支持SSH连接、命令执行、文件传输等功能
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

// SSH配置存储
let sshConfig = {
  host: null,
  username: null,
  privateKey: null,
  port: 22
};

// 创建MCP服务器
const server = new Server(
  {
    name: 'ssh-mcp-server',
    version: '1.0.0',
    description: 'SSH服务器连接工具，用于Serv00部署'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// 工具：配置SSH连接
server.setToolHandler('configure_ssh', async (args) => {
  try {
    sshConfig = {
      host: args.host,
      username: args.username,
      privateKey: args.privateKey || null,
      port: args.port || 22
    };

    return {
      content: [{
        type: 'text',
        text: `SSH配置已更新:\n主机: ${sshConfig.host}\n用户名: ${sshConfig.username}\n端口: ${sshConfig.port}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `配置失败: ${error.message}`
      }],
      isError: true
    };
  }
});

// 工具：测试SSH连接
server.setToolHandler('test_ssh_connection', async () => {
  if (!sshConfig.host || !sshConfig.username) {
    return {
      content: [{
        type: 'text',
        text: '错误: SSH配置未完成，请先调用 configure_ssh'
      }],
      isError: true
    };
  }

  try {
    const cmd = sshConfig.privateKey
      ? `ssh -o StrictHostKeyChecking=no -i ${sshConfig.privateKey} -p ${sshConfig.port} ${sshConfig.username}@${sshConfig.host} "echo '连接成功'"`
      : `ssh -o StrictHostKeyChecking=no -p ${sshConfig.port} ${sshConfig.username}@${sshConfig.host} "echo '连接成功'"`;

    const { stdout, stderr } = await execAsync(cmd, { timeout: 10000 });

    return {
      content: [{
        type: 'text',
        text: `✅ SSH连接测试成功\n${stdout}${stderr ? '\n警告: ' + stderr : ''}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `❌ SSH连接测试失败: ${error.message}\n\n请确保:\n1. Serv00账户已启用SSH访问\n2. 网络连接正常\n3. 如果使用密钥认证，请确保密钥文件正确`
      }],
      isError: true
    };
  }
});

// 工具：执行远程命令
server.setToolHandler('execute_command', async (args) => {
  if (!sshConfig.host || !sshConfig.username) {
    return {
      content: [{
        type: 'text',
        text: '错误: SSH配置未完成'
      }],
      isError: true
    };
  }

  try {
    const cmd = sshConfig.privateKey
      ? `ssh -o StrictHostKeyChecking=no -i ${sshConfig.privateKey} -p ${sshConfig.port} ${sshConfig.username}@${sshConfig.host} "${args.command.replace(/"/g, '\\"')}"`
      : `ssh -o StrictHostKeyChecking=no -p ${sshConfig.port} ${sshConfig.username}@${sshConfig.host} "${args.command.replace(/"/g, '\\"')}"`;

    const { stdout, stderr } = await execAsync(cmd, { timeout: args.timeout || 30000 });

    return {
      content: [{
        type: 'text',
        text: `命令执行完成:\n${stdout}${stderr ? '\n错误输出: ' + stderr : ''}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `命令执行失败: ${error.message}`
      }],
      isError: true
    };
  }
});

// 工具：上传文件
server.setToolHandler('upload_file', async (args) => {
  if (!sshConfig.host || !sshConfig.username) {
    return {
      content: [{
        type: 'text',
        text: '错误: SSH配置未完成'
      }],
      isError: true
    };
  }

  try {
    const localPath = args.localPath;
    const remotePath = args.remotePath;

    // 检查本地文件是否存在
    await fs.access(localPath);

    const cmd = sshConfig.privateKey
      ? `scp -o StrictHostKeyChecking=no -i ${sshConfig.privateKey} -P ${sshConfig.port} "${localPath}" ${sshConfig.username}@${sshConfig.host}:"${remotePath}"`
      : `scp -o StrictHostKeyChecking=no -P ${sshConfig.port} "${localPath}" ${sshConfig.username}@${sshConfig.host}:"${remotePath}"`;

    const { stdout, stderr } = await execAsync(cmd, { timeout: 60000 });

    return {
      content: [{
        type: 'text',
        text: `✅ 文件上传成功\n本地: ${localPath}\n远程: ${remotePath}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `文件上传失败: ${error.message}`
      }],
      isError: true
    };
  }
});

// 工具：上传目录（批量文件）
server.setToolHandler('upload_directory', async (args) => {
  if (!sshConfig.host || !sshConfig.username) {
    return {
      content: [{
        type: 'text',
        text: '错误: SSH配置未完成'
      }],
      isError: true
    };
  }

  try {
    const localDir = args.localDir;
    const remoteDir = args.remoteDir;

    // 检查本地目录是否存在
    await fs.access(localDir);

    const cmd = sshConfig.privateKey
      ? `scp -o StrictHostKeyChecking=no -i ${sshConfig.privateKey} -P ${sshConfig.port} -r "${localDir}" ${sshConfig.username}@${sshConfig.host}:"${remoteDir}"`
      : `scp -o StrictHostKeyChecking=no -P ${sshConfig.port} -r "${localDir}" ${sshConfig.username}@${sshConfig.host}:"${remoteDir}"`;

    const { stdout, stderr } = await execAsync(cmd, { timeout: 120000 });

    return {
      content: [{
        type: 'text',
        text: `✅ 目录上传成功\n本地: ${localDir}\n远程: ${remoteDir}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `目录上传失败: ${error.message}`
      }],
      isError: true
    };
  }
});

// 工具：检查远程文件状态
server.setToolHandler('check_remote_file', async (args) => {
  if (!sshConfig.host || !sshConfig.username) {
    return {
      content: [{
        type: 'text',
        text: '错误: SSH配置未完成'
      }],
      isError: true
    };
  }

  try {
    const cmd = `test -f "${args.path}" && echo "存在" || echo "不存在"`;
    const result = await executeRemoteCommand(cmd);

    const exists = result.stdout.includes('存在');

    if (exists) {
      // 获取文件信息
      const infoCmd = `ls -la "${args.path}"`;
      const info = await executeRemoteCommand(infoCmd);

      return {
        content: [{
          type: 'text',
          text: `✅ 文件存在\n${info.stdout}`
        }]
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: `❌ 文件不存在: ${args.path}`
        }]
      };
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `检查文件失败: ${error.message}`
      }],
      isError: true
    };
  }
});

// 工具：Serv00快速部署
server.setToolHandler('serv00_deploy', async (args) => {
  if (!sshConfig.host || !sshConfig.username) {
    return {
      content: [{
        type: 'text',
        text: '错误: SSH配置未完成'
      }],
      isError: true
    };
  }

  try {
    const projectDir = args.projectDir || '~/domains/chat.yourdomain.com/app';

    // 1. 创建目录结构
    await executeRemoteCommand(`mkdir -p ${projectDir} ${projectDir}/../logs ${projectDir}/../backups`);

    // 2. 检查Node.js
    const nodeCheck = await executeRemoteCommand('node --version 2>/dev/null || echo "未安装"');

    // 3. 检查MySQL
    const mysqlCheck = await executeRemoteCommand('mysql --version 2>/dev/null || echo "未安装"');

    // 4. 检查PM2
    const pm2Check = await executeRemoteCommand('pm2 --version 2>/dev/null || echo "未安装"');

    return {
      content: [{
        type: 'text',
        text: `🔍 Serv00环境检查结果:\n\nNode.js: ${nodeCheck.stdout}\nMySQL: ${mysqlCheck.stdout}\nPM2: ${pm2Check.stdout}\n\n项目目录: ${projectDir}\n\n下一步:\n1. 上传项目文件\n2. 配置数据库\n3. 安装依赖: npm install\n4. 启动应用: npm run pm2:start`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `部署检查失败: ${error.message}`
      }],
      isError: true
    };
  }
});

// 辅助函数：执行远程命令
async function executeRemoteCommand(command) {
  const cmd = sshConfig.privateKey
    ? `ssh -o StrictHostKeyChecking=no -i ${sshConfig.privateKey} -p ${sshConfig.port} ${sshConfig.username}@${sshConfig.host} "${command.replace(/"/g, '\\"')}"`
    : `ssh -o StrictHostKeyChecking=no -p ${sshConfig.port} ${sshConfig.username}@${sshConfig.host} "${command.replace(/"/g, '\\"')}"`;

  return await execAsync(cmd, { timeout: 30000 });
}

// 工具列表
server.setToolHandler('list_tools', async () => {
  return {
    content: [{
      type: 'text',
      text: `🔧 SSH MCP服务器可用工具:\n\n` +
        `1. configure_ssh - 配置SSH连接参数\n` +
        `2. test_ssh_connection - 测试SSH连接\n` +
        `3. execute_command - 执行远程命令\n` +
        `4. upload_file - 上传单个文件\n` +
        `5. upload_directory - 上传整个目录\n` +
        `6. check_remote_file - 检查远程文件状态\n` +
        `7. serv00_deploy - Serv00部署检查\n` +
        `8. list_tools - 显示此帮助\n\n` +
        `使用流程:\n` +
        `1. 先调用 configure_ssh 配置连接\n` +
        `2. 调用 test_ssh_connection 测试连接\n` +
        `3. 使用其他工具进行部署操作`
    }]
  };
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('SSH MCP服务器已启动');
}

main().catch((error) => {
  console.error('服务器启动失败:', error);
  process.exit(1);
});
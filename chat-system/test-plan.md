# 聊天系统验证测试计划

## 测试策略概述

**目标**: 确保系统在Serv00环境下稳定运行，支持真实用户使用
**测试环境**: Serv00生产环境（先在测试子域名部署）
**测试周期**: 分阶段进行，每阶段验证后进入下一阶段

## 阶段1：基础功能测试

### 1.1 数据库连接测试
**测试脚本**: `tests/database-connection.test.js`
```javascript
const pool = require('../config/database');

async function testDatabaseConnection() {
  try {
    const [rows] = await pool.execute('SELECT 1 as test');
    console.log('✅ 数据库连接正常:', rows[0].test === 1);

    // 测试用户表
    const [users] = await pool.execute('SELECT COUNT(*) as count FROM users');
    console.log('✅ 用户表可访问，当前用户数:', users[0].count);

    return true;
  } catch (err) {
    console.error('❌ 数据库连接失败:', err.message);
    return false;
  }
}
```

**验收标准**:
- ✅ 数据库连接成功
- ✅ 所有表可正常访问
- ✅ 读写操作正常

### 1.2 API基础接口测试
**测试工具**: Postman / curl

**用户注册测试**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"test123"}'
```

**预期响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "testuser",
    "token": "jwt_token_here"
  }
}
```

**测试用例清单**:
- [ ] 注册新用户
- [ ] 重复用户名注册（应失败）
- [ ] 无效邮箱格式（应失败）
- [ ] 短密码注册（应失败）
- [ ] 用户登录
- [ ] 错误密码登录（应失败）
- [ ] 获取用户资料
- [ ] 更新用户资料
- [ ] 用户登出

### 1.3 Socket.io连接测试
**测试脚本**: `tests/socket-connection.test.js`
```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3000', {
  auth: { token: 'test_jwt_token' }
});

socket.on('connect', () => {
  console.log('✅ Socket连接成功');

  // 测试认证
  socket.emit('authenticate', { token: 'test_jwt_token' }, (response) => {
    console.log('✅ 认证响应:', response);
  });
});

socket.on('connect_error', (err) => {
  console.error('❌ Socket连接失败:', err.message);
});

setTimeout(() => {
  socket.disconnect();
}, 5000);
```

**验收标准**:
- ✅ Socket连接建立
- ✅ 认证机制工作
- ✅ 心跳机制正常

## 阶段2：核心功能测试

### 2.1 房间管理测试
**测试流程**:
1. 创建公共房间
2. 创建私有房间
3. 加入房间
4. 获取房间列表
5. 离开房间

**测试数据**:
```javascript
// 测试房间创建
const roomData = {
  name: "测试房间",
  description: "用于功能测试",
  type: "public",
  max_users: 20
};

// 测试加入房间
const joinData = {
  room_id: 1
};
```

**验收标准**:
- [ ] 房间创建成功
- [ ] 房间列表正确返回
- [ ] 加入房间成功
- [ ] 房间成员列表正确
- [ ] 离开房间成功

### 2.2 消息系统测试
**测试场景**:
1. 发送文本消息
2. 发送图片消息
3. 获取消息历史
4. 消息已读状态
5. 消息频率限制

**性能测试**:
```javascript
// 批量发送测试
async function testMessagePerformance() {
  const startTime = Date.now();
  const messageCount = 50;

  for (let i = 0; i < messageCount; i++) {
    await sendMessage(`测试消息 ${i}`);
  }

  const endTime = Date.now();
  const totalTime = endTime - startTime;
  const avgTime = totalTime / messageCount;

  console.log(`发送${messageCount}条消息，平均耗时: ${avgTime}ms`);

  // 验收标准: 平均耗时 < 100ms
  return avgTime < 100;
}
```

**验收标准**:
- [ ] 文本消息发送/接收 < 100ms
- [ ] 消息历史正确返回
- [ ] 分页功能正常
- [ ] 频率限制生效
- [ ] 消息存储正确

### 2.3 实时通信测试
**多用户并发测试**:
```javascript
// 模拟5个用户同时在线
const users = [];
for (let i = 0; i < 5; i++) {
  const socket = io('http://localhost:3000', {
    auth: { token: `user${i}_token` }
  });
  users.push(socket);
}

// 测试消息广播
users[0].emit('send_message', {
  room_id: 1,
  content: '并发测试消息'
});

// 验证所有用户收到消息
let receivedCount = 0;
users.forEach((socket, index) => {
  if (index > 0) {
    socket.on('message_received', (data) => {
      receivedCount++;
      console.log(`用户${index}收到消息:`, data.content);
    });
  }
});

setTimeout(() => {
  console.log(`消息广播成功率: ${receivedCount}/4`);
}, 2000);
```

**验收标准**:
- [ ] 5用户同时在线无异常
- [ ] 消息广播成功率100%
- [ ] 在线状态同步正确
- [ ] 输入状态同步正常

## 阶段3：用户系统测试

### 3.1 好友功能测试
**测试流程**:
1. 用户A发送好友请求给用户B
2. 用户B接受请求
3. 验证好友列表
4. 用户A屏蔽用户B
5. 验证屏蔽效果

**测试数据**:
```javascript
const friendRequest = {
  friend_id: 2  // 用户B的ID
};

const action = {
  action: 'accept'  // 或 'reject', 'block'
};
```

**验收标准**:
- [ ] 好友请求发送成功
- [ ] 好友请求通知正确
- [ ] 接受/拒绝功能正常
- [ ] 好友列表更新正确
- [ ] 屏蔽功能生效

### 3.2 通知系统测试
**测试场景**:
1. 好友请求通知
2. 新消息通知
3. 系统通知
4. 通知已读标记
5. 通知列表分页

**验收标准**:
- [ ] 通知实时推送
- [ ] 通知列表正确
- [ ] 已读标记生效
- [ ] 通知类型分类正确

### 3.3 用户状态测试
**测试场景**:
1. 用户登录/登出状态变化
2. 在线状态实时更新
3. 最后登录时间记录
4. 离线消息处理

**验收标准**:
- [ ] 登录后状态为在线
- [ ] 登出后状态为离线
- [ ] 其他用户能实时看到状态变化
- [ ] 最后登录时间准确

## 阶段4：性能和压力测试

### 4.1 连接数测试
**测试目标**: 验证Serv00环境下的最大并发连接数

**测试脚本**:
```javascript
const io = require('socket.io-client');

async function testMaxConnections() {
  const connections = [];
  const maxConnections = 60; // 超过预期限制

  for (let i = 0; i < maxConnections; i++) {
    try {
      const socket = io('http://localhost:3000', {
        auth: { token: `user${i}_token` },
        timeout: 5000
      });

      connections.push(new Promise((resolve, reject) => {
        socket.on('connect', () => resolve(socket));
        socket.on('connect_error', (err) => reject(err));
      }));

      await new Promise(resolve => setTimeout(resolve, 50)); // 间隔50ms
    } catch (err) {
      console.log(`连接${i}失败:`, err.message);
      break;
    }
  }

  const successful = await Promise.allSettled(connections);
  const successCount = successful.filter(r => r.status === 'fulfilled').length;

  console.log(`成功连接: ${successCount}/${maxConnections}`);

  // 清理
  connections.forEach(p => {
    p.then(socket => socket.disconnect()).catch(() => {});
  });

  return successCount;
}
```

**验收标准**:
- ✅ 至少支持30个并发连接
- ✅ 连接建立时间 < 2秒
- ✅ 连接失败时优雅降级

### 4.2 消息吞吐量测试
**测试目标**: 测量系统消息处理能力

**测试场景**:
```javascript
// 10用户，每人发送100条消息
const testScenarios = [
  { users: 5, messagesPerUser: 50, description: "轻载" },
  { users: 10, messagesPerUser: 100, description: "中载" },
  { users: 20, messagesPerUser: 200, description: "重载" }
];

// 测量指标:
// - 平均消息延迟
// - 消息丢失率
// - CPU/内存使用
// - 数据库查询时间
```

**验收标准**:
- 轻载: 平均延迟 < 50ms
- 中载: 平均延迟 < 150ms
- 重载: 平均延迟 < 300ms
- 消息丢失率 = 0%

### 4.3 内存泄漏测试
**测试脚本**:
```javascript
const process = require('process');

function checkMemory() {
  const used = process.memoryUsage();
  return {
    heapUsed: Math.round(used.heapUsed / 1024 / 1024) + 'MB',
    heapTotal: Math.round(used.heapTotal / 1024 / 1024) + 'MB',
    external: Math.round(used.external / 1024 / 1024) + 'MB'
  };
}

// 运行24小时，每小时检查一次
async function longRunningTest() {
  const initialMemory = checkMemory();
  console.log('初始内存:', initialMemory);

  for (let hour = 1; hour <= 24; hour++) {
    await new Promise(resolve => setTimeout(resolve, 3600000)); // 1小时

    const currentMemory = checkMemory();
    console.log(`第${hour}小时内存:`, currentMemory);

    // 检查内存增长
    const growth = (parseFloat(currentMemory.heapUsed) - parseFloat(initialMemory.heapUsed));
    if (growth > 100) { // 增长超过100MB
      console.error('⚠️ 内存泄漏警告！');
      return false;
    }
  }

  return true;
}
```

**验收标准**:
- 24小时内内存增长 < 50MB
- 无明显的内存泄漏模式

## 阶段5：安全测试

### 5.1 认证安全测试
**测试项目**:
- [ ] JWT令牌验证
- [ ] 无效令牌拒绝
- [ ] 过期令牌处理
- [ ] 令牌篡改检测
- [ ] 密码加密验证 (bcrypt)
- [ ] SQL注入防护
- [ ] XSS攻击防护

**测试用例**:
```javascript
// SQL注入测试
const maliciousInput = {
  username: "admin' OR '1'='1",
  password: "anything' OR '1'='1"
};

// XSS测试
const xssInput = {
  content: "<script>alert('xss')</script>"
};

// 验证这些输入被正确转义或拒绝
```

### 5.2 数据安全测试
**测试项目**:
- [ ] 敏感数据不返回 (密码哈希)
- [ ] 用户权限隔离
- [ ] 私有房间访问控制
- [ ] 消息删除权限
- [ ] 数据备份完整性

### 5.3 频率限制测试
**测试脚本**:
```javascript
async function testRateLimit() {
  const token = 'test_token';
  const requests = 50; // 超过限制

  let successCount = 0;
  let rateLimitedCount = 0;

  for (let i = 0; i < requests; i++) {
    const response = await fetch('http://localhost:3000/api/messages/1', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: `消息${i}` })
    });

    if (response.status === 429) {
      rateLimitedCount++;
    } else if (response.ok) {
      successCount++;
    }

    await new Promise(resolve => setTimeout(resolve, 100)); // 100ms间隔
  }

  console.log(`成功: ${successCount}, 被限制: ${rateLimitedCount}`);
  return rateLimitedCount > 0; // 应该触发限制
}
```

**验收标准**:
- 每分钟超过30条消息触发限制
- 限制响应时间 < 100ms
- 限制后恢复时间正确

## 阶段6：集成测试

### 6.1 端到端用户流程测试
**完整用户旅程**:
1. 用户注册 → 登录 → 创建房间 → 邀请好友 → 发送消息 → 登出
2. 验证每个步骤的数据一致性
3. 验证状态同步

### 6.2 跨设备测试
**测试场景**:
- 同一用户多设备登录
- 设备间消息同步
- 断线重连恢复

### 6.3 浏览器兼容性测试
**支持浏览器**:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (iOS/macOS)
- [ ] 移动端浏览器

## 阶段7：生产环境验证

### 7.1 Serv00环境特有问题测试
**特定测试**:
- [ ] 进程守护测试（PM2重启）
- [ ] 内存限制测试（接近512MB时行为）
- [ ] CPU限制测试（10-20%限制影响）
- [ ] 网络延迟测试
- [ ] 数据库连接池限制测试

### 7.2 监控和告警测试
**验证监控脚本**:
```bash
# 测试监控脚本
node scripts/monitor.js

# 验证日志输出
tail -f logs/monitor.log

# 测试备份脚本
node scripts/backup.js

# 验证备份文件
ls -la backups/
```

### 7.3 灾难恢复测试
**测试场景**:
1. 手动杀死Node.js进程 → 验证PM2自动重启
2. 数据库连接断开 → 验证重连机制
3. 服务器重启 → 验证服务自动恢复
4. 数据丢失 → 验证备份恢复

## 测试执行计划

### 时间安排
```
Day 1: 阶段1-2 (基础功能)
Day 2: 阶段3-4 (用户系统 + 性能)
Day 3: 阶段5-6 (安全 + 集成)
Day 4: 阶段7 (生产验证)
Day 5: 问题修复 + 重新测试
```

### 测试工具清单
- **API测试**: Postman, curl
- **Socket测试**: 自定义脚本, Socket.io测试工具
- **性能测试**: Apache Bench (ab), 自定义脚本
- **监控**: PM2, 自定义监控脚本
- **日志**: PM2 logs, 自定义日志分析

### 成功标准
**必须全部通过**:
- ✅ 所有基础功能正常
- ✅ 支持至少30个并发用户
- ✅ 消息延迟 < 300ms
- ✅ 无安全漏洞
- ✅ 24小时稳定运行
- ✅ 内存增长 < 50MB
- ✅ 自动备份正常

**可接受问题**:
- ⚠️ 高负载下性能下降（但服务可用）
- ⚠️ 偶发的网络超时（Serv00环境限制）

**必须修复**:
- ❌ 数据丢失
- ❌ 安全漏洞
- ❌ 进程崩溃不重启
- ❌ 数据库连接泄漏

## 测试报告模板

```markdown
# 测试报告 - 聊天系统

**测试日期**: YYYY-MM-DD
**测试人员**: Claude Code
**环境**: Serv00测试环境

## 测试概览
- 总测试用例: X
- 通过: Y
- 失败: Z
- 通过率: (Y/X)%

## 关键指标
- 并发用户数: XX
- 平均消息延迟: XXms
- 内存使用: XXMB
- CPU使用: XX%

## 发现问题
1. [问题描述] - [严重程度] - [解决方案]
2. ...

## 建议
- 性能优化建议
- 功能改进建议
- 部署注意事项

## 结论
[ ] 通过 - 可以部署生产环境
[ ] 有条件通过 - 需修复以下问题
[ ] 不通过 - 需重大修改

**签字**: _______________
```

---

## 快速测试命令

```bash
# 运行所有测试
npm test

# 运行特定阶段
npm run test:database
npm run test:api
npm run test:socket
npm run test:performance
npm run test:security

# 生成测试报告
npm run test:report

# 持续测试（开发模式）
npm run test:watch
```

**预计测试时间**: 3-5天
**测试覆盖率目标**: 核心功能 > 90%
# 聊天系统API接口和Socket事件规范

## REST API 接口

### 用户认证模块

#### POST /api/auth/register
**用户注册**
- 请求体:
```json
{
  "username": "string(3-20)",
  "email": "string(email)",
  "password": "string(6-20)"
}
```
- 响应:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "user1",
    "email": "user1@example.com",
    "token": "jwt_token_here"
  }
}
```

#### POST /api/auth/login
**用户登录**
- 请求体:
```json
{
  "email": "string",
  "password": "string"
}
```
- 响应:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "user1",
    "token": "jwt_token_here",
    "last_login": "2026-01-04T14:30:00Z"
  }
}
```

#### POST /api/auth/logout
**用户登出** (需要认证)
- 响应:
```json
{
  "success": true,
  "message": "登出成功"
}
```

#### GET /api/auth/profile
**获取用户资料** (需要认证)
- 响应:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "user1",
    "email": "user1@example.com",
    "avatar": "/images/default-avatar.png",
    "status_message": "在线",
    "is_online": true,
    "last_login": "2026-01-04T14:30:00Z"
  }
}
```

#### PUT /api/auth/profile
**更新用户资料** (需要认证)
- 请求体:
```json
{
  "avatar": "string(url)",
  "status_message": "string(100)"
}
```

### 房间管理模块

#### GET /api/rooms
**获取房间列表** (需要认证)
- 查询参数: `type=public|private|group`, `page=1`, `limit=20`
- 响应:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "公共大厅",
      "description": "所有人可见的公共聊天室",
      "type": "public",
      "user_count": 15,
      "max_users": 100,
      "is_active": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

#### POST /api/rooms
**创建房间** (需要认证)
- 请求体:
```json
{
  "name": "string(2-50)",
  "description": "string(255)",
  "type": "private|group",
  "max_users": 50
}
```

#### GET /api/rooms/:id
**获取房间详情** (需要认证)
- 响应:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "技术交流",
    "description": "编程技术讨论",
    "type": "group",
    "created_by": 1,
    "max_users": 50,
    "is_active": true,
    "members": [
      {
        "id": 1,
        "username": "user1",
        "role": "owner",
        "is_online": true
      }
    ]
  }
}
```

#### POST /api/rooms/:id/join
**加入房间** (需要认证)
- 响应:
```json
{
  "success": true,
  "data": {
    "room_id": 1,
    "user_id": 2,
    "role": "member",
    "joined_at": "2026-01-04T14:30:00Z"
  }
}
```

#### POST /api/rooms/:id/leave
**离开房间** (需要认证)

### 消息模块

#### GET /api/messages/:room_id
**获取房间消息历史** (需要认证)
- 查询参数: `limit=50`, `before=消息ID` (用于分页)
- 响应:
```json
{
  "success": true,
  "data": [
    {
      "id": 1001,
      "room_id": 1,
      "user_id": 1,
      "username": "user1",
      "content": "你好，大家好！",
      "message_type": "text",
      "created_at": "2026-01-04T14:25:00Z",
      "reads": 5
    }
  ],
  "pagination": {
    "has_more": true,
    "last_id": 1001
  }
}
```

#### POST /api/messages/:room_id
**发送消息** (需要认证)
- 请求体:
```json
{
  "content": "string(1000)",
  "message_type": "text|image|file",
  "file_url": "string(url)" // 仅当message_type不为text时需要
}
```

### 好友模块

#### GET /api/friends
**获取好友列表** (需要认证)
- 查询参数: `status=accepted|pending|blocked`
- 响应:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "friend_id": 2,
      "username": "user2",
      "status": "accepted",
      "is_online": true,
      "status_message": "忙碌"
    }
  ]
}
```

#### POST /api/friends/request
**发送好友请求** (需要认证)
- 请求体:
```json
{
  "friend_id": 2
}
```

#### PUT /api/friends/:id
**处理好友请求** (需要认证)
- 请求体:
```json
{
  "action": "accept|reject|block"
}
```

### 通知模块

#### GET /api/notifications
**获取通知列表** (需要认证)
- 查询参数: `is_read=false`, `limit=20`
- 响应:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "friend_request",
      "title": "好友请求",
      "content": "user2 请求添加您为好友",
      "related_id": 2,
      "is_read": false,
      "created_at": "2026-01-04T14:20:00Z"
    }
  ]
}
```

#### PUT /api/notifications/:id/read
**标记通知为已读** (需要认证)

## Socket.io 事件

### 客户端 → 服务器事件

#### `authenticate`
**客户端认证**
```javascript
socket.emit('authenticate', { token: 'jwt_token' }, (response) => {
  // response: { success: true, user_id: 1 }
});
```

#### `join_room`
**加入房间**
```javascript
socket.emit('join_room', { room_id: 1 }, (response) => {
  // response: { success: true, room_id: 1, users: [...] }
});
```

#### `leave_room`
**离开房间**
```javascript
socket.emit('leave_room', { room_id: 1 });
```

#### `send_message`
**发送实时消息**
```javascript
socket.emit('send_message', {
  room_id: 1,
  content: 'Hello World!',
  message_type: 'text'
});
```

#### `typing_start`
**开始输入**
```javascript
socket.emit('typing_start', { room_id: 1 });
```

#### `typing_stop`
**停止输入**
```javascript
socket.emit('typing_stop', { room_id: 1 });
```

#### `message_read`
**标记消息已读**
```javascript
socket.emit('message_read', { message_id: 1001 });
```

### 服务器 → 客户端事件

#### `message_received`
**收到新消息**
```javascript
socket.on('message_received', (data) => {
  // data: {
  //   id: 1001,
  //   room_id: 1,
  //   user_id: 1,
  //   username: "user1",
  //   content: "Hello!",
  //   message_type: "text",
  //   created_at: "2026-01-04T14:30:00Z"
  // }
});
```

#### `user_joined`
**用户加入房间**
```javascript
socket.on('user_joined', (data) => {
  // data: { room_id: 1, user_id: 2, username: "user2" }
});
```

#### `user_left`
**用户离开房间**
```javascript
socket.on('user_left', (data) => {
  // data: { room_id: 1, user_id: 2, username: "user2" }
});
```

#### `user_typing`
**用户正在输入**
```javascript
socket.on('user_typing', (data) => {
  // data: { room_id: 1, user_id: 2, username: "user2" }
});
```

#### `user_online_status`
**用户在线状态变化**
```javascript
socket.on('user_online_status', (data) => {
  // data: { user_id: 2, is_online: true }
});
```

#### `notification`
**新通知**
```javascript
socket.on('notification', (data) => {
  // data: {
  //   type: "friend_request",
  //   title: "好友请求",
  //   content: "user2 请求添加您为好友"
  // }
});
```

#### `error`
**错误通知**
```javascript
socket.on('error', (data) => {
  // data: { message: "错误信息", code: "ERROR_CODE" }
});
```

## 错误码定义

| 错误码 | 说明 | HTTP状态码 |
|--------|------|------------|
| `AUTH_REQUIRED` | 需要认证 | 401 |
| `INVALID_TOKEN` | 无效的token | 401 |
| `USER_EXISTS` | 用户已存在 | 409 |
| `INVALID_CREDENTIALS` | 无效的凭据 | 401 |
| `ROOM_NOT_FOUND` | 房间不存在 | 404 |
| `PERMISSION_DENIED` | 权限不足 | 403 |
| `INVALID_PARAMS` | 参数错误 | 400 |
| `RATE_LIMIT` | 请求过于频繁 | 429 |
| `INTERNAL_ERROR` | 服务器内部错误 | 500 |

## 认证中间件

所有需要认证的接口必须在请求头中包含：
```
Authorization: Bearer <jwt_token>
```

## 实时连接限制

- **最大连接数**: 50个并发Socket连接
- **心跳间隔**: 30秒
- **超时时间**: 60秒无响应自动断开
- **重连策略**: 指数退避，最大重试5次
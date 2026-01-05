/**
 * 安能物流农场游戏 - WebSocket 实时通信模块
 */

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const db = require('./db');

// 存储连接的客户端
const clients = new Map(); // userId -> WebSocket
const branchRooms = new Map(); // branchId -> Set<userId>

function setupWebSocket(server) {
    const wss = new WebSocket.Server({ server, path: '/ws' });

    wss.on('connection', (ws, req) => {
        let userId = null;
        let branchId = null;

        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);

                switch (data.type) {
                    case 'auth':
                        // 验证身份
                        try {
                            const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
                            userId = decoded.userId;
                            branchId = decoded.branchId;

                            clients.set(userId, ws);

                            // 加入分拨房间
                            if (!branchRooms.has(branchId)) {
                                branchRooms.set(branchId, new Set());
                            }
                            branchRooms.get(branchId).add(userId);

                            // 更新在线状态
                            await db.query(
                                `INSERT INTO online_status (user_id, is_online, last_seen)
                                 VALUES (?, 1, NOW())
                                 ON DUPLICATE KEY UPDATE is_online = 1, last_seen = NOW()`,
                                [userId]
                            );

                            ws.send(JSON.stringify({ type: 'auth_success', userId }));

                            // 通知分拨成员有人上线
                            broadcastToBranch(branchId, {
                                type: 'user_online',
                                userId,
                                timestamp: Date.now()
                            }, userId);
                        } catch (err) {
                            ws.send(JSON.stringify({ type: 'auth_error', message: '认证失败' }));
                        }
                        break;

                    case 'branch_message':
                        // 分拨聊天消息
                        if (!userId || !branchId) {
                            ws.send(JSON.stringify({ type: 'error', message: '未认证' }));
                            return;
                        }

                        const branchMsg = await saveBranchMessage(userId, branchId, data.content);
                        broadcastToBranch(branchId, {
                            type: 'branch_message',
                            message: branchMsg
                        });
                        break;

                    case 'world_message':
                        // 世界聊天消息
                        if (!userId) {
                            ws.send(JSON.stringify({ type: 'error', message: '未认证' }));
                            return;
                        }

                        const worldMsg = await saveWorldMessage(userId, data.content);
                        if (worldMsg.error) {
                            ws.send(JSON.stringify({ type: 'error', message: worldMsg.error }));
                        } else {
                            broadcastToAll({
                                type: 'world_message',
                                message: worldMsg
                            });
                        }
                        break;

                    case 'private_message':
                        // 私聊消息
                        if (!userId) {
                            ws.send(JSON.stringify({ type: 'error', message: '未认证' }));
                            return;
                        }

                        const privateMsg = await savePrivateMessage(
                            userId,
                            data.targetUserId,
                            data.content,
                            data.messageType || 'text'
                        );

                        // 发送给发送者
                        ws.send(JSON.stringify({
                            type: 'private_message',
                            message: privateMsg
                        }));

                        // 发送给接收者
                        const targetWs = clients.get(data.targetUserId);
                        if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                            targetWs.send(JSON.stringify({
                                type: 'private_message',
                                message: privateMsg
                            }));
                        }
                        break;

                    case 'typing':
                        // 正在输入状态
                        if (data.targetUserId) {
                            const targetClient = clients.get(data.targetUserId);
                            if (targetClient && targetClient.readyState === WebSocket.OPEN) {
                                targetClient.send(JSON.stringify({
                                    type: 'typing',
                                    userId,
                                    isTyping: data.isTyping
                                }));
                            }
                        }
                        break;

                    case 'ping':
                        ws.send(JSON.stringify({ type: 'pong' }));
                        break;
                }
            } catch (err) {
                console.error('WebSocket 消息处理错误:', err);
            }
        });

        ws.on('close', async () => {
            if (userId) {
                clients.delete(userId);

                // 从分拨房间移除
                if (branchId && branchRooms.has(branchId)) {
                    branchRooms.get(branchId).delete(userId);
                }

                // 更新在线状态
                await db.query(
                    `UPDATE online_status SET is_online = 0, last_seen = NOW() WHERE user_id = ?`,
                    [userId]
                );

                // 通知分拨成员有人下线
                if (branchId) {
                    broadcastToBranch(branchId, {
                        type: 'user_offline',
                        userId,
                        timestamp: Date.now()
                    }, userId);
                }
            }
        });

        ws.on('error', (err) => {
            console.error('WebSocket 错误:', err);
        });
    });

    console.log('WebSocket 服务已初始化');
    return wss;
}

// 向分拨内所有用户广播
function broadcastToBranch(branchId, message, excludeUserId = null) {
    const room = branchRooms.get(branchId);
    if (!room) return;

    const msgStr = JSON.stringify(message);
    for (const uid of room) {
        if (uid !== excludeUserId) {
            const ws = clients.get(uid);
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(msgStr);
            }
        }
    }
}

// 向所有用户广播
function broadcastToAll(message) {
    const msgStr = JSON.stringify(message);
    for (const ws of clients.values()) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(msgStr);
        }
    }
}

// 保存分拨消息
async function saveBranchMessage(userId, branchId, content) {
    const user = await db.queryOne('SELECT nickname, avatar FROM users WHERE user_id = ?', [userId]);
    const messageId = 'msg_' + Date.now();

    await db.insert(
        `INSERT INTO branch_messages (message_id, branch_id, user_id, nickname, avatar, content)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [messageId, branchId, userId, user.nickname, user.avatar, content]
    );

    // 更新聊天统计
    await db.query(
        `INSERT INTO chat_stats (user_id, branch_count, total_count)
         VALUES (?, 1, 1)
         ON DUPLICATE KEY UPDATE branch_count = branch_count + 1, total_count = total_count + 1`,
        [userId]
    );

    return {
        id: messageId,
        branchId,
        userId,
        nickname: user.nickname,
        avatar: user.avatar,
        content,
        timestamp: Date.now(),
        type: 'branch'
    };
}

// 保存世界消息
async function saveWorldMessage(userId, content) {
    const user = await db.queryOne(
        'SELECT nickname, avatar, branch_id, branch_name FROM users WHERE user_id = ?',
        [userId]
    );

    // 检查广播喇叭
    const item = await db.queryOne(
        'SELECT count FROM user_items WHERE user_id = ? AND item_id = ?',
        [userId, 'broadcast']
    );

    if (!item || item.count <= 0) {
        return { error: '广播喇叭数量不足' };
    }

    // 消耗道具
    await db.update(
        'UPDATE user_items SET count = count - 1 WHERE user_id = ? AND item_id = ?',
        [userId, 'broadcast']
    );

    const messageId = 'world_' + Date.now();

    await db.insert(
        `INSERT INTO world_messages (message_id, user_id, nickname, avatar, branch_id, branch_name, content)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [messageId, userId, user.nickname, user.avatar, user.branch_id, user.branch_name, content]
    );

    // 更新聊天统计
    await db.query(
        `INSERT INTO chat_stats (user_id, world_count, total_count)
         VALUES (?, 1, 1)
         ON DUPLICATE KEY UPDATE world_count = world_count + 1, total_count = total_count + 1`,
        [userId]
    );

    return {
        id: messageId,
        userId,
        nickname: user.nickname,
        avatar: user.avatar,
        branchId: user.branch_id,
        branchName: user.branch_name,
        content,
        timestamp: Date.now(),
        type: 'world'
    };
}

// 保存私聊消息
async function savePrivateMessage(senderId, receiverId, content, messageType) {
    const sender = await db.queryOne('SELECT nickname, avatar FROM users WHERE user_id = ?', [senderId]);
    const messageId = 'pm_' + Date.now();

    await db.insert(
        `INSERT INTO private_messages (message_id, sender_id, receiver_id, sender_nickname, sender_avatar, content, message_type)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [messageId, senderId, receiverId, sender.nickname, sender.avatar, content, messageType]
    );

    // 更新会话列表
    const timestamp = Date.now();

    // 发送者的会话
    const receiver = await db.queryOne('SELECT nickname, avatar FROM users WHERE user_id = ?', [receiverId]);
    await db.query(
        `INSERT INTO conversations (user_id, target_user_id, target_nickname, target_avatar, last_message, last_message_type, last_message_time, unread_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)
         ON DUPLICATE KEY UPDATE last_message = ?, last_message_type = ?, last_message_time = ?`,
        [senderId, receiverId, receiver?.nickname || '用户', receiver?.avatar || '', content, messageType, timestamp,
         content, messageType, timestamp]
    );

    // 接收者的会话
    await db.query(
        `INSERT INTO conversations (user_id, target_user_id, target_nickname, target_avatar, last_message, last_message_type, last_message_time, unread_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE last_message = ?, last_message_type = ?, last_message_time = ?, unread_count = unread_count + 1`,
        [receiverId, senderId, sender.nickname, sender.avatar, content, messageType, timestamp,
         content, messageType, timestamp]
    );

    return {
        id: messageId,
        senderId,
        receiverId,
        senderNickname: sender.nickname,
        senderAvatar: sender.avatar,
        content,
        messageType,
        timestamp,
        read: false
    };
}

module.exports = { setupWebSocket, clients, branchRooms, broadcastToBranch, broadcastToAll };

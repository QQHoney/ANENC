/**
 * 安能物流农场游戏 - 真实后端 API 客户端
 * 替代原来的本地存储模拟 API
 */

// API 基础配置
const API_CONFIG = {
    baseUrl: '', // 同域部署时为空，跨域时填写完整URL如 'https://your-domain.serv00.net'
    wsUrl: ''    // WebSocket URL，同域时自动推导
};

// 获取存储的 token
function getToken() {
    return localStorage.getItem('authToken');
}

// 设置 token
function setToken(token) {
    localStorage.setItem('authToken', token);
}

// 清除 token
function clearToken() {
    localStorage.removeItem('authToken');
}

// 通用请求方法
async function request(url, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };

    try {
        const response = await fetch(API_CONFIG.baseUrl + url, {
            ...options,
            headers
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('请求错误:', error);
        return { success: false, message: '网络错误，请稍后重试' };
    }
}

// GET 请求
async function get(url) {
    return request(url, { method: 'GET' });
}

// POST 请求
async function post(url, data) {
    return request(url, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

// DELETE 请求
async function del(url) {
    return request(url, { method: 'DELETE' });
}

// ==================== 用户 API ====================
const userApi = {
    // 用户注册
    async register(data) {
        const result = await post('/api/auth/register', data);
        if (result.success && result.data?.token) {
            setToken(result.data.token);
            Storage.setUserInfo(result.data.userInfo);
        }
        return result;
    },

    // 用户登录
    async login(data) {
        const result = await post('/api/auth/login', data);
        if (result.success && result.data?.token) {
            setToken(result.data.token);
            Storage.setUserInfo(result.data.userInfo);
        }
        return result;
    },

    // 登出
    logout() {
        clearToken();
        Storage.removeUserInfo();
        if (window.wsClient) {
            window.wsClient.close();
        }
    },

    // 获取用户信息
    async getUserInfo() {
        const result = await get('/api/user/info');
        if (result.success) {
            Storage.setUserInfo(result.data);
        }
        return result;
    },

    // 更新用户信息
    async updateUserInfo(userId, updates) {
        return post('/api/user/update', updates);
    },

    // 增加经验值
    async addExp(userId, exp) {
        return post('/api/user/addExp', { exp });
    },

    // 获取分拨列表
    async getBranches() {
        return get('/api/auth/branches');
    }
};

// ==================== 站场 API ====================
const stationApi = {
    // 获取自己的站场货物
    async getStationCargos() {
        return get('/api/station/cargos');
    },

    // 获取好友站场货物
    async getFriendCargos(targetUserId) {
        return get(`/api/station/friend/${targetUserId}`);
    },

    // 放置货物
    async placeCargo(userId, slotIndex, cargoTypeId) {
        return post('/api/station/place', { slotIndex, cargoTypeId });
    },

    // 收取货物
    async harvestCargo(userId, cargoId) {
        return post('/api/station/harvest', { cargoId });
    },

    // 使用防护盾
    async useProtectionShield(userId, cargoId) {
        return post('/api/station/protect', { cargoId });
    },

    // 使用加速卡
    async useSpeedUp(userId, cargoId) {
        return post('/api/station/speedup', { cargoId });
    },

    // 截胡货物
    async stealCargo(targetUserId, cargoId) {
        return post('/api/station/steal', { targetUserId, cargoId });
    },

    // 获取好友站场
    async getFriendCargos(targetUserId) {
        return get(`/api/station/friend/${targetUserId}`);
    }
};

// ==================== 好友 API ====================
const friendApi = {
    // 获取好友列表
    async getFriendList(userId) {
        return get('/api/friend/list');
    },

    // 添加好友
    async addFriend(userId, targetUserId) {
        return post('/api/friend/add', { targetUserId });
    },

    // 删除好友
    async removeFriend(userId, targetUserId) {
        return post('/api/friend/remove', { targetUserId });
    },

    // 获取分拨成员
    async getBranchMembers(branchId, page = 1, pageSize = 20) {
        return get(`/api/friend/branch/${branchId}?page=${page}&pageSize=${pageSize}`);
    },

    // 搜索用户
    async searchUsers(keyword) {
        return get(`/api/friend/search?keyword=${encodeURIComponent(keyword)}`);
    }
};

// ==================== 聊天 API ====================
const chatApi = {
    // 获取分拨聊天记录
    async getBranchChatHistory(branchId, limit = 50) {
        return get(`/api/chat/branch/${branchId}?limit=${limit}`);
    },

    // 发送分拨消息（通过 WebSocket）
    async sendBranchMessage(branchId, userId, content) {
        if (window.wsClient && window.wsClient.readyState === WebSocket.OPEN) {
            window.wsClient.send(JSON.stringify({
                type: 'branch_message',
                content
            }));
            return { success: true };
        }
        return { success: false, message: '聊天连接已断开' };
    },

    // 获取世界聊天记录
    async getWorldChatHistory(limit = 50) {
        return get(`/api/chat/world?limit=${limit}`);
    },

    // 发送世界消息（通过 WebSocket）
    async sendWorldMessage(userId, content) {
        if (window.wsClient && window.wsClient.readyState === WebSocket.OPEN) {
            window.wsClient.send(JSON.stringify({
                type: 'world_message',
                content
            }));
            return { success: true };
        }
        return { success: false, message: '聊天连接已断开' };
    }
};

// ==================== 私聊 API ====================
const privateChatApi = {
    // 获取私聊记录
    async getPrivateChatHistory(userId, targetUserId, limit = 50) {
        return get(`/api/chat/private/${targetUserId}?limit=${limit}`);
    },

    // 发送私聊消息（通过 WebSocket）
    async sendPrivateMessage(userId, targetUserId, content, messageType = 'text') {
        if (window.wsClient && window.wsClient.readyState === WebSocket.OPEN) {
            window.wsClient.send(JSON.stringify({
                type: 'private_message',
                targetUserId,
                content,
                messageType
            }));
            return { success: true };
        }
        return { success: false, message: '聊天连接已断开' };
    },

    // 获取会话列表
    async getConversationList(userId) {
        return get('/api/chat/conversations');
    },

    // 标记会话已读
    async markConversationAsRead(userId, targetUserId) {
        return post(`/api/chat/read/${targetUserId}`, {});
    },

    // 获取未读消息数
    async getTotalUnreadCount(userId) {
        return get('/api/chat/unread');
    },

    // 删除会话
    async deleteConversation(userId, targetUserId) {
        return del(`/api/chat/conversation/${targetUserId}`);
    },

    // 获取在线状态
    async getUserOnlineStatus(userIds) {
        return post('/api/chat/online-status', { userIds });
    },

    // 更新自己的在线状态（通过 WebSocket 自动处理）
    async updateOnlineStatus(userId, online = true) {
        // 在线状态通过 WebSocket 连接自动管理
        return { success: true };
    }
};

// ==================== 商城 API ====================
const shopApi = {
    // 获取商品列表
    async getShopItems(category) {
        const url = category ? `/api/shop/items?category=${category}` : '/api/shop/items';
        return get(url);
    },

    // 购买商品
    async buyItem(userId, itemId, count = 1) {
        return post('/api/shop/buy', { itemId, count });
    }
};

// ==================== 排行榜 API ====================
const rankingApi = {
    // 获取排行榜
    async getRanking(type = 'coins', branchId = null) {
        const url = branchId ? `/api/ranking/${type}?branchId=${branchId}` : `/api/ranking/${type}`;
        return get(url);
    },

    // 获取用户排名
    async getMyRanking(type = 'coins') {
        return get(`/api/ranking/${type}/my`);
    }
};

// ==================== 成就 API ====================
const achievementApi = {
    // 获取用户成就
    async getUserAchievements(userId) {
        return get('/api/achievement/all');
    },

    // 领取成就奖励
    async checkAndClaimAchievement(userId, achievementId) {
        return post('/api/achievement/claim', { achievementId });
    },

    // 获取可领取成就
    async getClaimableAchievements(userId) {
        return get('/api/achievement/claimable');
    },

    // 获取未完成成就
    async getUnclaimedAchievements(userId) {
        const result = await get('/api/achievement/all');
        if (!result.success) {
            return { success: true, data: [] };
        }

        const unclaimed = [];
        for (const category of Object.values(result.data)) {
            for (const ach of category) {
                if (!ach.claimed && !ach.canClaim) {
                    unclaimed.push(ach);
                }
            }
        }

        return { success: true, data: unclaimed };
    },

    // 更新成就进度（由后端自动处理，此处仅为兼容性保留）
    async updateAchievementProgress(userId, progressKey) {
        return { success: true };
    }
};

// ==================== 签到 API ====================
const checkInApi = {
    // 获取签到状态
    async getUserCheckIn(userId) {
        return get('/api/checkIn/status');
    },

    // 执行签到
    async checkIn(userId) {
        return post('/api/checkIn/do', {});
    },

    // 获取签到奖励预览
    async getCheckInRewards() {
        return get('/api/checkIn/rewards');
    },

    // 检查今天是否可签到
    async canCheckIn(userId) {
        const result = await get('/api/checkIn/status');
        if (result.success && result.data) {
            return { success: true, data: { canCheckIn: result.data.canCheckIn, consecutiveDays: result.data.consecutiveDays } };
        }
        return { success: true, data: { canCheckIn: true, consecutiveDays: 0 } };
    }
};

// ==================== 任务 API ====================
const taskApi = {
    // 获取所有任务
    async getAllTasks(userId) {
        return get('/api/task/all');
    },

    // 更新任务进度
    async updateTaskProgress(userId, taskType, taskId, increment = 1) {
        return post('/api/task/progress', { taskType, taskId, increment });
    },

    // 领取任务奖励
    async claimTaskReward(userId, taskType, taskId) {
        return post('/api/task/claim', { taskType, taskId });
    },

    // 获取可领取的任务
    async getClaimableTasks(userId) {
        const result = await get('/api/task/all');
        if (!result.success) {
            return { success: true, data: { daily: [], weekly: [], challenge: [] } };
        }

        const claimable = {
            daily: result.data.daily?.filter(t => t.completed && !t.claimed) || [],
            weekly: result.data.weekly?.filter(t => t.completed && !t.claimed) || [],
            challenge: result.data.challenge?.filter(t => t.completed && !t.claimed) || []
        };

        return { success: true, data: claimable };
    },

    // 获取未完成的任务
    async getUncompletedTasks(userId) {
        const result = await get('/api/task/all');
        if (!result.success) {
            return { success: true, data: { daily: [], weekly: [], challenge: [] } };
        }

        const uncompleted = {
            daily: result.data.daily?.filter(t => !t.completed) || [],
            weekly: result.data.weekly?.filter(t => !t.completed) || [],
            challenge: result.data.challenge?.filter(t => !t.completed) || []
        };

        return { success: true, data: uncompleted };
    }
};

// ==================== 亲密度 API ====================
const intimacyApi = {
    // 获取亲密度配置
    async getConfig() {
        return get('/api/intimacy/config');
    },

    // 获取与指定好友的亲密度信息
    async getFriendIntimacy(friendId) {
        return get(`/api/intimacy/friend/${friendId}`);
    },

    // 获取所有好友的亲密度列表
    async getIntimacyList() {
        return get('/api/intimacy/list');
    },

    // 送礼物
    async sendGift(friendId, giftId, message = '') {
        return post('/api/intimacy/gift', { friendId, giftId, message });
    },

    // 增加亲密度（聊天等行为）
    async addIntimacy(friendId, action) {
        return post('/api/intimacy/add', { friendId, action });
    },

    // 领取等级奖励
    async claimReward(friendId, level) {
        return post('/api/intimacy/claim-reward', { friendId, level });
    },

    // 获取可领取的奖励列表
    async getClaimableRewards(friendId) {
        return get(`/api/intimacy/claimable-rewards/${friendId}`);
    },

    // 获取礼物列表
    async getGifts() {
        return get('/api/intimacy/gifts');
    },

    // 获取收到的礼物记录
    async getReceivedGifts(limit = 20) {
        return get(`/api/intimacy/received-gifts?limit=${limit}`);
    },

    // 获取未读礼物数量
    async getUnreadGiftsCount() {
        return get('/api/intimacy/unread-gifts');
    }
};

// ==================== WebSocket 客户端 ====================
class WebSocketClient {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.listeners = {};
    }

    connect() {
        const token = getToken();
        if (!token) {
            console.log('未登录，无法连接 WebSocket');
            return;
        }

        // 构建 WebSocket URL
        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = API_CONFIG.wsUrl || `${protocol}//${location.host}/ws`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('WebSocket 已连接');
            this.reconnectAttempts = 0;

            // 发送认证
            this.ws.send(JSON.stringify({
                type: 'auth',
                token
            }));
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.emit(data.type, data);
            } catch (e) {
                console.error('解析 WebSocket 消息错误:', e);
            }
        };

        this.ws.onclose = () => {
            console.log('WebSocket 已断开');
            this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket 错误:', error);
        };

        window.wsClient = this.ws;

        // 注册消息处理回调
        this.setupMessageHandlers();
    }

    // 设置消息处理器
    setupMessageHandlers() {
        // 分拨消息
        this.on('branch_message', (data) => {
            if (typeof App !== 'undefined' && App.appendChatMessage) {
                App.appendChatMessage(data.message, 'branch');
            }
        });

        // 世界消息
        this.on('world_message', (data) => {
            if (typeof App !== 'undefined' && App.appendChatMessage) {
                App.appendChatMessage(data.message, 'world');
            }
        });

        // 私聊消息
        this.on('private_message', (data) => {
            if (typeof App !== 'undefined' && App.handleNewPrivateMessage) {
                App.handleNewPrivateMessage(data.message);
            }
        });

        // 用户上线
        this.on('user_online', (data) => {
            console.log('用户上线:', data.userId);
        });

        // 用户下线
        this.on('user_offline', (data) => {
            console.log('用户下线:', data.userId);
        });
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`尝试重连 WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => this.connect(), this.reconnectDelay);
        }
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    close() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

// 全局 WebSocket 客户端实例
const wsClient = new WebSocketClient();

// 页面加载时检查登录状态并连接 WebSocket
document.addEventListener('DOMContentLoaded', () => {
    if (getToken()) {
        wsClient.connect();
    }
});

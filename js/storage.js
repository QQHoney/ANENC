// 本地存储封装
const Storage = {
    // 用户信息
    getUserInfo() {
        const data = localStorage.getItem('userInfo');
        return data ? JSON.parse(data) : null;
    },

    setUserInfo(userInfo) {
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
    },

    removeUserInfo() {
        localStorage.removeItem('userInfo');
    },

    // 成就数据
    getAchievements() {
        const data = localStorage.getItem('userAchievements');
        return data ? JSON.parse(data) : {};
    },

    setAchievements(achievements) {
        localStorage.setItem('userAchievements', JSON.stringify(achievements));
    },

    // 签到数据
    getCheckIn() {
        const data = localStorage.getItem('userCheckIn');
        return data ? JSON.parse(data) : {};
    },

    setCheckIn(checkInData) {
        localStorage.setItem('userCheckIn', JSON.stringify(checkInData));
    },

    // 任务数据
    getTasks() {
        const data = localStorage.getItem('userTasks');
        return data ? JSON.parse(data) : {};
    },

    setTasks(tasks) {
        localStorage.setItem('userTasks', JSON.stringify(tasks));
    },

    // 站场货物
    getStationCargos(userId) {
        const data = localStorage.getItem('stationCargos_' + userId);
        return data ? JSON.parse(data) : [];
    },

    setStationCargos(userId, cargos) {
        localStorage.setItem('stationCargos_' + userId, JSON.stringify(cargos));
    },

    // 好友列表
    getFriendList(userId) {
        const data = localStorage.getItem('friendList_' + userId);
        return data ? JSON.parse(data) : [];
    },

    setFriendList(userId, friends) {
        localStorage.setItem('friendList_' + userId, JSON.stringify(friends));
    },

    // 分拨聊天记录
    getBranchChat(branchId) {
        const data = localStorage.getItem('branchChat_' + branchId);
        return data ? JSON.parse(data) : [];
    },

    setBranchChat(branchId, messages) {
        // 只保留最近500条
        const trimmed = messages.slice(-500);
        localStorage.setItem('branchChat_' + branchId, JSON.stringify(trimmed));
    },

    // 世界聊天记录
    getWorldChat() {
        const data = localStorage.getItem('worldChat');
        return data ? JSON.parse(data) : [];
    },

    setWorldChat(messages) {
        // 只保留最近1000条
        const trimmed = messages.slice(-1000);
        localStorage.setItem('worldChat', JSON.stringify(trimmed));
    },

    // 排行榜数据
    getRankings(type) {
        const data = localStorage.getItem('rankings_' + type);
        return data ? JSON.parse(data) : [];
    },

    setRankings(type, rankings) {
        localStorage.setItem('rankings_' + type, JSON.stringify(rankings));
    },

    // 分拨成员
    getBranchMembers(branchId) {
        const data = localStorage.getItem('branchMembers_' + branchId);
        return data ? JSON.parse(data) : [];
    },

    setBranchMembers(branchId, members) {
        localStorage.setItem('branchMembers_' + branchId, JSON.stringify(members));
    },

    // 私聊消息
    getPrivateChat(conversationId) {
        const data = localStorage.getItem('privateChat_' + conversationId);
        return data ? JSON.parse(data) : [];
    },

    setPrivateChat(conversationId, messages) {
        const trimmed = messages.slice(-200);
        localStorage.setItem('privateChat_' + conversationId, JSON.stringify(trimmed));
    },

    // 会话列表
    getConversations(userId) {
        const data = localStorage.getItem('conversations_' + userId);
        return data ? JSON.parse(data) : [];
    },

    setConversations(userId, conversations) {
        localStorage.setItem('conversations_' + userId, JSON.stringify(conversations));
    },

    // 未读消息计数
    getUnreadCount(userId) {
        const data = localStorage.getItem('unreadCount_' + userId);
        return data ? JSON.parse(data) : {};
    },

    setUnreadCount(userId, counts) {
        localStorage.setItem('unreadCount_' + userId, JSON.stringify(counts));
    },

    // 用户在线状态
    getOnlineStatus() {
        const data = localStorage.getItem('onlineStatus');
        return data ? JSON.parse(data) : {};
    },

    setOnlineStatus(status) {
        localStorage.setItem('onlineStatus', JSON.stringify(status));
    },

    // 清除所有数据
    clearAll() {
        localStorage.clear();
    }
};

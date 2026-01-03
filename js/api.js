// API封装 - 模拟后端接口，使用本地存储
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 用户API
const userApi = {
    // 用户注册
    async register(data) {
        await delay(300);
        const userId = 'user_' + Date.now();
        const branch = getBranchById(data.branchId);
        const gifts = CONFIG.newUserGifts;

        const userInfo = {
            userId,
            nickname: data.nickname,
            avatar: 'assets/default-avatar.svg',
            branchId: data.branchId,
            branchName: branch ? branch.name : '未知分拨',
            level: 1,
            exp: 0,
            coins: gifts.coins,
            diamonds: gifts.diamonds,
            items: gifts.items.map(item => ({ ...item })),
            stationSlots: CONFIG.initialSlots,
            stealCount: 0,
            createTime: Date.now()
        };

        Storage.setUserInfo(userInfo);

        // 添加到分拨成员列表
        const members = Storage.getBranchMembers(data.branchId);
        members.push({
            userId,
            nickname: data.nickname,
            avatar: userInfo.avatar,
            level: 1
        });
        Storage.setBranchMembers(data.branchId, members);

        // 初始化排行榜数据
        this.updateRankings(userInfo);

        return { success: true, data: userInfo };
    },

    // 获取用户信息
    async getUserInfo(userId) {
        await delay(100);
        const userInfo = Storage.getUserInfo();
        return { success: true, data: userInfo };
    },

    // 更新用户信息
    async updateUserInfo(userId, updates) {
        await delay(100);
        const userInfo = Storage.getUserInfo();
        const newUserInfo = { ...userInfo, ...updates };
        Storage.setUserInfo(newUserInfo);
        return { success: true, data: newUserInfo };
    },

    // 增加经验值
    async addExp(userId, exp) {
        await delay(50);
        const userInfo = Storage.getUserInfo();
        userInfo.exp += exp;

        // 检查升级
        const levelUpExp = getLevelUpExp(userInfo.level);
        if (userInfo.exp >= levelUpExp) {
            userInfo.level += 1;
            userInfo.exp -= levelUpExp;
            // 升级奖励
            userInfo.coins += userInfo.level * CONFIG.levelUpCoinMultiplier;
            userInfo.stationSlots = getStationSlots(userInfo.level);
        }

        Storage.setUserInfo(userInfo);
        this.updateRankings(userInfo);
        return { success: true, data: userInfo };
    },

    // 更新排行榜
    updateRankings(userInfo) {
        // 财富榜
        let coinsRankings = Storage.getRankings('coins');
        const coinsIndex = coinsRankings.findIndex(r => r.userId === userInfo.userId);
        const coinsEntry = {
            userId: userInfo.userId,
            nickname: userInfo.nickname,
            avatar: userInfo.avatar,
            branchId: userInfo.branchId,
            branchName: userInfo.branchName,
            value: userInfo.coins
        };
        if (coinsIndex >= 0) {
            coinsRankings[coinsIndex] = coinsEntry;
        } else {
            coinsRankings.push(coinsEntry);
        }
        coinsRankings.sort((a, b) => b.value - a.value);
        Storage.setRankings('coins', coinsRankings.slice(0, 100));

        // 等级榜
        let levelRankings = Storage.getRankings('level');
        const levelIndex = levelRankings.findIndex(r => r.userId === userInfo.userId);
        const levelEntry = {
            userId: userInfo.userId,
            nickname: userInfo.nickname,
            avatar: userInfo.avatar,
            branchId: userInfo.branchId,
            branchName: userInfo.branchName,
            value: userInfo.level
        };
        if (levelIndex >= 0) {
            levelRankings[levelIndex] = levelEntry;
        } else {
            levelRankings.push(levelEntry);
        }
        levelRankings.sort((a, b) => b.value - a.value);
        Storage.setRankings('level', levelRankings.slice(0, 100));

        // 截胡榜
        let stealRankings = Storage.getRankings('steal');
        const stealIndex = stealRankings.findIndex(r => r.userId === userInfo.userId);
        const stealEntry = {
            userId: userInfo.userId,
            nickname: userInfo.nickname,
            avatar: userInfo.avatar,
            branchId: userInfo.branchId,
            branchName: userInfo.branchName,
            value: userInfo.stealCount || 0
        };
        if (stealIndex >= 0) {
            stealRankings[stealIndex] = stealEntry;
        } else {
            stealRankings.push(stealEntry);
        }
        stealRankings.sort((a, b) => b.value - a.value);
        Storage.setRankings('steal', stealRankings.slice(0, 100));
    }
};

// 站场API
const stationApi = {
    // 获取站场货物列表
    async getStationCargos(userId) {
        await delay(100);
        const cargos = Storage.getStationCargos(userId);
        return { success: true, data: cargos };
    },

    // 放置货物
    async placeCargo(userId, slotIndex, cargoTypeId) {
        await delay(100);
        const cargos = Storage.getStationCargos(userId);
        const cargoType = getCargoTypeById(cargoTypeId);

        if (!cargoType) {
            return { success: false, message: '货物类型不存在' };
        }

        // 检查货位是否已被占用
        if (cargos.find(c => c.slotIndex === slotIndex)) {
            return { success: false, message: '该货位已被占用' };
        }

        const cargo = {
            id: 'cargo_' + Date.now(),
            slotIndex,
            typeId: cargoTypeId,
            typeName: cargoType.name,
            startTime: Date.now(),
            growTime: cargoType.growTime * 1000,
            value: cargoType.baseValue,
            exp: cargoType.exp,
            status: 'growing',
            isProtected: false
        };

        cargos.push(cargo);
        Storage.setStationCargos(userId, cargos);
        return { success: true, data: cargo };
    },

    // 收取货物
    async harvestCargo(userId, cargoId) {
        await delay(100);
        let cargos = Storage.getStationCargos(userId);
        const cargoIndex = cargos.findIndex(c => c.id === cargoId);

        if (cargoIndex === -1) {
            return { success: false, message: '货物不存在' };
        }

        const cargo = cargos[cargoIndex];
        const now = Date.now();

        if (now - cargo.startTime < cargo.growTime) {
            return { success: false, message: '货物还未准备好' };
        }

        // 移除货物
        cargos.splice(cargoIndex, 1);
        Storage.setStationCargos(userId, cargos);

        // 增加金币
        const userInfo = Storage.getUserInfo();
        userInfo.coins += cargo.value;
        Storage.setUserInfo(userInfo);
        userApi.updateRankings(userInfo);

        return {
            success: true,
            data: {
                coins: cargo.value,
                exp: cargo.exp
            }
        };
    },

    // 使用保护盾
    async useProtectionShield(userId, cargoId) {
        await delay(100);
        let cargos = Storage.getStationCargos(userId);
        const cargo = cargos.find(c => c.id === cargoId);

        if (!cargo) {
            return { success: false, message: '货物不存在' };
        }

        // 检查道具
        const userInfo = Storage.getUserInfo();
        const shieldItem = userInfo.items.find(i => i.id === 'protection_shield');

        if (!shieldItem || shieldItem.count <= 0) {
            return { success: false, message: '防护盾数量不足' };
        }

        // 消耗道具
        shieldItem.count -= 1;
        cargo.isProtected = true;
        cargo.status = 'protected';

        Storage.setUserInfo(userInfo);
        Storage.setStationCargos(userId, cargos);

        return { success: true, data: cargo };
    },

    // 使用加速卡
    async useSpeedUp(userId, cargoId) {
        await delay(100);
        let cargos = Storage.getStationCargos(userId);
        const cargo = cargos.find(c => c.id === cargoId);

        if (!cargo) {
            return { success: false, message: '货物不存在' };
        }

        const userInfo = Storage.getUserInfo();
        const speedItem = userInfo.items.find(i => i.id === 'speed_up');

        if (!speedItem || speedItem.count <= 0) {
            return { success: false, message: '加速卡数量不足' };
        }

        // 消耗道具并减少一半时间
        speedItem.count -= 1;
        cargo.startTime -= cargo.growTime / 2;

        Storage.setUserInfo(userInfo);
        Storage.setStationCargos(userId, cargos);

        return { success: true, data: cargo };
    },

    // 截胡货物
    async stealCargo(targetUserId, cargoId) {
        await delay(200);
        let targetCargos = Storage.getStationCargos(targetUserId);
        const cargoIndex = targetCargos.findIndex(c => c.id === cargoId);

        if (cargoIndex === -1) {
            return { success: false, message: '货物不存在' };
        }

        const cargo = targetCargos[cargoIndex];

        if (cargo.isProtected) {
            return { success: false, message: '该货物受防护盾保护，无法截胡' };
        }

        const now = Date.now();
        if (now - cargo.startTime < cargo.growTime) {
            return { success: false, message: '货物还未成熟，无法截胡' };
        }

        // 截胡成功
        const stolenValue = Math.floor(cargo.value * CONFIG.stealRatio);
        cargo.value = Math.floor(cargo.value * (1 - CONFIG.stealRatio));
        cargo.stolen = true;
        Storage.setStationCargos(targetUserId, targetCargos);

        // 增加自己的金币和截胡次数
        const userInfo = Storage.getUserInfo();
        userInfo.coins += stolenValue;
        userInfo.stealCount = (userInfo.stealCount || 0) + 1;
        Storage.setUserInfo(userInfo);
        userApi.updateRankings(userInfo);

        return {
            success: true,
            data: {
                stolenValue,
                message: `成功截胡，获得 ${stolenValue} 金币！`
            }
        };
    }
};

// 好友API
const friendApi = {
    // 获取好友列表
    async getFriendList(userId, branchId) {
        await delay(100);
        const friends = Storage.getFriendList(userId);
        return { success: true, data: friends };
    },

    // 添加好友
    async addFriend(userId, targetUserId) {
        await delay(100);
        let friends = Storage.getFriendList(userId);

        if (friends.find(f => f.userId === targetUserId)) {
            return { success: false, message: '已经是好友了' };
        }

        friends.push({
            userId: targetUserId,
            addTime: Date.now()
        });

        Storage.setFriendList(userId, friends);
        return { success: true };
    },

    // 获取分拨成员列表
    async getBranchMembers(branchId, page = 1, pageSize = 20) {
        await delay(100);
        const members = Storage.getBranchMembers(branchId);
        return {
            success: true,
            data: {
                list: members.slice((page - 1) * pageSize, page * pageSize),
                total: members.length
            }
        };
    }
};

// 聊天API
const chatApi = {
    // 获取分拨聊天记录
    async getBranchChatHistory(branchId, limit = 50) {
        await delay(100);
        const messages = Storage.getBranchChat(branchId);
        return {
            success: true,
            data: messages.slice(-limit)
        };
    },

    // 发送分拨聊天消息
    async sendBranchMessage(branchId, userId, content) {
        await delay(50);
        const userInfo = Storage.getUserInfo();
        let messages = Storage.getBranchChat(branchId);

        const message = {
            id: 'msg_' + Date.now(),
            userId,
            nickname: userInfo.nickname,
            avatar: userInfo.avatar,
            content,
            timestamp: Date.now(),
            type: 'branch'
        };

        messages.push(message);
        Storage.setBranchChat(branchId, messages);

        // 更新聊天次数统计（用于成就检查）
        this.updateChatStats(userId, 'branch');

        return { success: true, data: message };
    },

    // 获取世界聊天记录
    async getWorldChatHistory(limit = 50) {
        await delay(100);
        const messages = Storage.getWorldChat();
        return {
            success: true,
            data: messages.slice(-limit)
        };
    },

    // 发送世界聊天消息
    async sendWorldMessage(userId, content) {
        await delay(50);
        const userInfo = Storage.getUserInfo();

        // 检查广播喇叭数量
        const broadcastItem = userInfo.items.find(i => i.id === 'broadcast');
        if (!broadcastItem || broadcastItem.count <= 0) {
            return { success: false, message: '广播喇叭数量不足，请前往商城购买' };
        }

        // 消耗广播喇叭
        broadcastItem.count -= 1;
        Storage.setUserInfo(userInfo);

        let messages = Storage.getWorldChat();

        const message = {
            id: 'world_' + Date.now(),
            userId,
            nickname: userInfo.nickname,
            avatar: userInfo.avatar,
            branchId: userInfo.branchId,
            branchName: userInfo.branchName,
            content,
            timestamp: Date.now(),
            type: 'world'
        };

        messages.push(message);
        Storage.setWorldChat(messages);

        // 更新聊天次数统计（用于成就检查）
        this.updateChatStats(userId, 'world');

        return { success: true, data: message };
    },

    // 更新聊天统计（用于成就检查）
    updateChatStats(userId, type) {
        let achievements = Storage.getAchievements();

        if (!achievements[userId]) {
            achievements[userId] = {
                claimed: [],
                progress: {}
            };
        }

        // 初始化聊天计数器
        if (!achievements[userId].chatCount) {
            achievements[userId].chatCount = {
                branch: 0,
                world: 0,
                total: 0
            };
        }

        // 更新计数
        achievements[userId].chatCount[type] += 1;
        achievements[userId].chatCount.total += 1;

        // 检查成就条件
        if (achievements[userId].chatCount.total >= 10) {
            achievements[userId].progress.chat_10 = true;
        }
        if (achievements[userId].chatCount.branch >= 20) {
            achievements[userId].progress.branch_active = true;
        }

        Storage.setAchievements(achievements);
    }
};

// 商城API
const shopApi = {
    // 获取商城商品列表
    async getShopItems(category) {
        await delay(100);
        let items = CONFIG.shopItems;
        if (category) {
            items = items.filter(i => i.category === category);
        }
        return { success: true, data: items };
    },

    // 购买商品
    async buyItem(userId, itemId, count = 1) {
        await delay(100);
        const shopItem = getShopItemById(itemId);

        if (!shopItem) {
            return { success: false, message: '商品不存在' };
        }

        const userInfo = Storage.getUserInfo();
        const totalPrice = shopItem.price * count;

        // 检查货币是否足够
        if (shopItem.currency === 'coins' && userInfo.coins < totalPrice) {
            return { success: false, message: '金币不足' };
        }
        if (shopItem.currency === 'diamonds' && userInfo.diamonds < totalPrice) {
            return { success: false, message: '钻石不足' };
        }

        // 扣除货币
        if (shopItem.currency === 'coins') {
            userInfo.coins -= totalPrice;
        } else {
            userInfo.diamonds -= totalPrice;
        }

        // 增加道具
        let userItem = userInfo.items.find(i => i.id === itemId);
        if (userItem) {
            userItem.count += count;
        } else {
            userInfo.items.push({
                id: itemId,
                name: shopItem.name,
                count: count,
                desc: shopItem.desc
            });
        }

        Storage.setUserInfo(userInfo);
        userApi.updateRankings(userInfo);
        return { success: true, data: userInfo };
    }
};

// 排行榜API
const rankingApi = {
    // 获取排行榜
    async getRanking(type = 'coins', branchId = null) {
        await delay(100);
        let rankings = Storage.getRankings(type);

        if (branchId) {
            rankings = rankings.filter(r => r.branchId === branchId);
        }

        return { success: true, data: rankings };
    }
};

// 成就API
const achievementApi = {
    // 获取用户成就数据
    async getUserAchievements(userId) {
        await delay(50);
        const achievements = Storage.getAchievements();
        return { success: true, data: achievements };
    },

    // 检查并领取成就奖励
    async checkAndClaimAchievement(userId, achievementId) {
        await delay(100);
        const userInfo = Storage.getUserInfo();
        let achievements = Storage.getAchievements();

        // 初始化用户成就记录
        if (!achievements[userId]) {
            achievements[userId] = {
                claimed: [],
                progress: {
                    first_register: true,
                    first_harvest: false,
                    first_steal: false,
                    level_5: false,
                    level_10: false,
                    level_20: false,
                    steal_10: false,
                    steal_50: false,
                    steal_100: false,
                    friend_5: false,
                    chat_10: false,
                    branch_active: false,
                    earn_10000: false,
                    earn_50000: false,
                    earn_100000: false
                }
            };
        }

        const userAchievements = achievements[userId];

        // 检查是否已领取
        if (userAchievements.claimed.includes(achievementId)) {
            return { success: false, message: '该成就已领取' };
        }

        // 检查成就条件
        const canClaim = this.checkAchievementCondition(achievementId, userInfo, userAchievements.progress);

        if (!canClaim) {
            return { success: false, message: '未达成成就条件' };
        }

        // 查找成就配置
        const allAchievements = [
            ...CONFIG.achievements.beginner,
            ...CONFIG.achievements.growth,
            ...CONFIG.achievements.social,
            ...CONFIG.achievements.wealth
        ];
        const achievement = allAchievements.find(a => a.id === achievementId);

        if (!achievement) {
            return { success: false, message: '成就不存在' };
        }

        // 发放奖励
        const reward = achievement.reward;
        userInfo.coins += reward.coins || 0;
        userInfo.diamonds += reward.diamonds || 0;

        // 标记为已领取
        userAchievements.claimed.push(achievementId);

        // 保存数据
        Storage.setUserInfo(userInfo);
        Storage.setAchievements(achievements);

        return {
            success: true,
            data: {
                achievement: achievement,
                reward: reward,
                newBalance: {
                    coins: userInfo.coins,
                    diamonds: userInfo.diamonds
                }
            }
        };
    },

    // 检查成就条件
    checkAchievementCondition(achievementId, userInfo, progress) {
        switch (achievementId) {
            // 新手成就
            case 'first_register':
                return progress.first_register === true;
            case 'first_harvest':
                return progress.first_harvest === true;
            case 'first_steal':
                return progress.first_steal === true;

            // 成长成就
            case 'level_5':
                return userInfo.level >= 5;
            case 'level_10':
                return userInfo.level >= 10;
            case 'level_20':
                return userInfo.level >= 20;
            case 'steal_10':
                return (userInfo.stealCount || 0) >= 10;
            case 'steal_50':
                return (userInfo.stealCount || 0) >= 50;
            case 'steal_100':
                return (userInfo.stealCount || 0) >= 100;

            // 社交成就
            case 'friend_5':
                const friends = Storage.getFriendList(userInfo.userId);
                return friends.length >= 5;
            case 'chat_10':
                return progress.chat_10 === true; // 需要在聊天API中更新
            case 'branch_active':
                return progress.branch_active === true; // 需要在聊天API中更新

            // 财富成就
            case 'earn_10000':
                return progress.earn_10000 === true; // 需要在收获时检查
            case 'earn_50000':
                return progress.earn_50000 === true;
            case 'earn_100000':
                return progress.earn_100000 === true;

            default:
                return false;
        }
    },

    // 更新成就进度（供其他API调用）
    async updateAchievementProgress(userId, progressKey) {
        let achievements = Storage.getAchievements();

        if (!achievements[userId]) {
            achievements[userId] = {
                claimed: [],
                progress: {}
            };
        }

        achievements[userId].progress[progressKey] = true;
        Storage.setAchievements(achievements);
    },

    // 获取可领取的成就列表
    async getClaimableAchievements(userId) {
        await delay(50);
        const userInfo = Storage.getUserInfo();
        const achievements = Storage.getAchievements();
        const userAchievements = achievements[userId] || { claimed: [], progress: {} };

        const allAchievements = [
            ...CONFIG.achievements.beginner,
            ...CONFIG.achievements.growth,
            ...CONFIG.achievements.social,
            ...CONFIG.achievements.wealth
        ];

        const claimable = allAchievements.filter(ach => {
            // 已领取的不显示
            if (userAchievements.claimed.includes(ach.id)) {
                return false;
            }
            // 检查是否满足条件
            return this.checkAchievementCondition(ach.id, userInfo, userAchievements.progress);
        });

        return { success: true, data: claimable };
    },

    // 获取未完成的成就列表
    async getUnclaimedAchievements(userId) {
        await delay(50);
        const userInfo = Storage.getUserInfo();
        const achievements = Storage.getAchievements();
        const userAchievements = achievements[userId] || { claimed: [], progress: {} };

        const allAchievements = [
            ...CONFIG.achievements.beginner,
            ...CONFIG.achievements.growth,
            ...CONFIG.achievements.social,
            ...CONFIG.achievements.wealth
        ];

        const unclaimed = allAchievements.filter(ach => {
            // 已领取的不显示
            if (userAchievements.claimed.includes(ach.id)) {
                return false;
            }
            // 检查是否满足条件
            return !this.checkAchievementCondition(ach.id, userInfo, userAchievements.progress);
        });

        return { success: true, data: unclaimed };
    }
};

// 签到API
const checkInApi = {
    // 获取用户签到数据
    async getUserCheckIn(userId) {
        await delay(50);
        const checkInData = Storage.getCheckIn();
        // 修复：确保返回正确的数据结构
        if (!checkInData || !checkInData[userId]) {
            return { success: true, data: null };
        }
        return { success: true, data: checkInData[userId] };
    },

    // 执行签到
    async checkIn(userId) {
        await delay(100);
        const userInfo = Storage.getUserInfo();
        let checkInData = Storage.getCheckIn();

        // 初始化用户签到数据
        if (!checkInData[userId]) {
            checkInData[userId] = {
                lastCheckInDate: null,
                consecutiveDays: 0,
                totalCheckIns: 0,
                claimedRewards: []
            };
        }

        const userCheckIn = checkInData[userId];
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        // 检查今天是否已签到
        if (userCheckIn.lastCheckInDate === today) {
            return { success: false, message: '今天已经签到过了' };
        }

        // 检查连续性
        if (userCheckIn.lastCheckInDate === yesterday) {
            userCheckIn.consecutiveDays += 1;
        } else if (userCheckIn.lastCheckInDate !== today) {
            userCheckIn.consecutiveDays = 1;
        }

        // 更新签到日期
        userCheckIn.lastCheckInDate = today;
        userCheckIn.totalCheckIns += 1;

        // 计算基础奖励（支持超过7天的奖励）
        const dayIndex = userCheckIn.consecutiveDays - 1;
        const rewardIndex = Math.min(dayIndex, CONFIG.checkInRewards.length - 1);
        const reward = CONFIG.checkInRewards[rewardIndex];

        // 检查是否有额外奖励
        let bonusReward = null;
        const consecutiveDays = userCheckIn.consecutiveDays;
        if (CONFIG.consecutiveBonus[consecutiveDays]) {
            bonusReward = CONFIG.consecutiveBonus[consecutiveDays];
        }

        // 发放基础奖励
        userInfo.coins += reward.coins;
        userInfo.diamonds += reward.diamonds;

        // 发放额外奖励
        let bonusMessage = '';
        if (bonusReward) {
            userInfo.coins += bonusReward.coins;
            userInfo.diamonds += bonusReward.diamonds;

            // 添加道具
            const item = userInfo.items.find(i => i.id === bonusReward.item);
            if (item) {
                item.count += bonusReward.itemCount;
            } else {
                const shopItem = CONFIG.shopItems.find(i => i.id === bonusReward.item);
                if (shopItem) {
                    userInfo.items.push({
                        id: bonusReward.item,
                        name: shopItem.name,
                        count: bonusReward.itemCount,
                        desc: shopItem.desc
                    });
                }
            }

            bonusMessage = ` + 额外奖励 💎${bonusReward.diamonds} 💰${bonusReward.coins} + ${bonusReward.itemCount}个${shopItem?.name || bonusReward.item}`;
        }

        // 保存数据
        Storage.setUserInfo(userInfo);
        Storage.setCheckIn(checkInData);

        return {
            success: true,
            data: {
                consecutiveDays: userCheckIn.consecutiveDays,
                reward: reward,
                bonus: bonusReward,
                newBalance: {
                    coins: userInfo.coins,
                    diamonds: userInfo.diamonds
                },
                message: bonusMessage
            }
        };
    },

    // 获取连续签到奖励预览
    async getCheckInRewards() {
        await delay(50);
        return { success: true, data: CONFIG.checkInRewards };
    },

    // 检查今天是否可以签到
    async canCheckIn(userId) {
        await delay(50);
        const checkInData = Storage.getCheckIn();
        const userCheckIn = checkInData[userId];

        if (!userCheckIn) {
            return { success: true, data: { canCheckIn: true, consecutiveDays: 0 } };
        }

        const today = new Date().toDateString();
        const canCheckIn = userCheckIn.lastCheckInDate !== today;

        return {
            success: true,
            data: {
                canCheckIn: canCheckIn,
                consecutiveDays: userCheckIn.consecutiveDays,
                lastCheckInDate: userCheckIn.lastCheckInDate
            }
        };
    }
};

// 任务API
const taskApi = {
    // 获取用户任务数据
    async getUserTasks(userId) {
        await delay(50);
        const tasks = Storage.getTasks();
        return { success: true, data: tasks[userId] || null };
    },

    // 获取所有任务列表（包含进度）
    async getAllTasks(userId) {
        await delay(50);
        const userInfo = Storage.getUserInfo();
        let tasks = Storage.getTasks();

        // 初始化用户任务数据
        if (!tasks[userId]) {
            tasks[userId] = {
                daily: {},
                weekly: {},
                challenge: {},
                lastResetDaily: null,
                lastResetWeekly: null
            };
        }

        const userTasks = tasks[userId];

        // 检查并重置每日任务
        this.checkAndResetTasks(userTasks);

        // 构建任务列表，包含进度
        const result = {
            daily: CONFIG.tasks.daily.map(task => ({
                ...task,
                progress: userTasks.daily[task.id] || 0,
                completed: (userTasks.daily[task.id] || 0) >= task.target,
                claimed: userTasks.daily[task.id + '_claimed'] || false
            })),
            weekly: CONFIG.tasks.weekly.map(task => ({
                ...task,
                progress: userTasks.weekly[task.id] || 0,
                completed: (userTasks.weekly[task.id] || 0) >= task.target,
                claimed: userTasks.weekly[task.id + '_claimed'] || false
            })),
            challenge: CONFIG.tasks.challenge.map(task => ({
                ...task,
                progress: userTasks.challenge[task.id] || 0,
                completed: (userTasks.challenge[task.id] || 0) >= task.target,
                claimed: userTasks.challenge[task.id + '_claimed'] || false
            }))
        };

        return { success: true, data: result };
    },

    // 更新任务进度
    async updateTaskProgress(userId, taskType, taskId, increment = 1) {
        await delay(50);
        let tasks = Storage.getTasks();

        // 初始化用户任务数据
        if (!tasks[userId]) {
            tasks[userId] = {
                daily: {},
                weekly: {},
                challenge: {},
                lastResetDaily: null,
                lastResetWeekly: null
            };
        }

        const userTasks = tasks[userId];

        // 检查并重置任务
        this.checkAndResetTasks(userTasks);

        // 更新进度
        if (!userTasks[taskType][taskId]) {
            userTasks[taskType][taskId] = 0;
        }
        userTasks[taskType][taskId] += increment;

        Storage.setTasks(tasks);

        return { success: true, data: userTasks[taskType][taskId] };
    },

    // 领取任务奖励
    async claimTaskReward(userId, taskType, taskId) {
        await delay(100);
        const userInfo = Storage.getUserInfo();
        let tasks = Storage.getTasks();

        if (!tasks[userId]) {
            return { success: false, message: '任务数据不存在' };
        }

        const userTasks = tasks[userId];

        // 查找任务配置
        const taskList = CONFIG.tasks[taskType];
        const task = taskList.find(t => t.id === taskId);

        if (!task) {
            return { success: false, message: '任务不存在' };
        }

        // 检查是否已领取
        if (userTasks[taskType][taskId + '_claimed']) {
            return { success: false, message: '奖励已领取' };
        }

        // 检查是否完成
        const progress = userTasks[taskType][taskId] || 0;
        if (progress < task.target) {
            return { success: false, message: '任务未完成' };
        }

        // 发放奖励
        userInfo.coins += task.reward.coins || 0;
        userInfo.diamonds += task.reward.diamonds || 0;

        // 标记为已领取
        userTasks[taskType][taskId + '_claimed'] = true;

        // 保存数据
        Storage.setUserInfo(userInfo);
        Storage.setTasks(tasks);

        return {
            success: true,
            data: {
                task: task,
                reward: task.reward,
                newBalance: {
                    coins: userInfo.coins,
                    diamonds: userInfo.diamonds
                }
            }
        };
    },

    // 检查并重置任务
    checkAndResetTasks(userTasks) {
        const now = new Date();
        const today = now.toDateString();
        const currentWeek = getWeekNumber(now);

        // 重置每日任务
        if (userTasks.lastResetDaily !== today) {
            userTasks.daily = {};
            userTasks.lastResetDaily = today;
        }

        // 重置每周任务
        if (userTasks.lastResetWeekly !== currentWeek) {
            userTasks.weekly = {};
            userTasks.lastResetWeekly = currentWeek;
        }
    },

    // 获取可领取的任务奖励
    async getClaimableTasks(userId) {
        await delay(50);
        const allTasks = await this.getAllTasks(userId);

        const claimable = {
            daily: allTasks.data.daily.filter(t => t.completed && !t.claimed),
            weekly: allTasks.data.weekly.filter(t => t.completed && !t.claimed),
            challenge: allTasks.data.challenge.filter(t => t.completed && !t.claimed)
        };

        return { success: true, data: claimable };
    },

    // 获取未完成的任务
    async getUncompletedTasks(userId) {
        await delay(50);
        const allTasks = await this.getAllTasks(userId);

        const uncompleted = {
            daily: allTasks.data.daily.filter(t => !t.completed),
            weekly: allTasks.data.weekly.filter(t => !t.completed),
            challenge: allTasks.data.challenge.filter(t => !t.completed)
        };

        return { success: true, data: uncompleted };
    }
};

// 辅助函数：获取一年中的第几周
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

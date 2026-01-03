// 游戏配置
const CONFIG = {
    // 分拨列表
    branches: [
        { id: 'langfang', name: '廊坊分拨', region: '华北' },
        { id: 'guangzhou', name: '广州分拨', region: '华南' },
        { id: 'wuhan', name: '武汉分拨', region: '华中' },
        { id: 'shanghai', name: '上海分拨', region: '华东' },
        { id: 'chengdu', name: '成都分拨', region: '西南' },
        { id: 'xian', name: '西安分拨', region: '西北' },
        { id: 'shenyang', name: '沈阳分拨', region: '东北' },
        { id: 'nanjing', name: '南京分拨', region: '华东' }
    ],

    // 货物类型配置
    cargoTypes: [
        { id: 'small', name: '小件包裹', growTime: 60, baseValue: 10, exp: 5 },
        { id: 'medium', name: '中型货物', growTime: 180, baseValue: 30, exp: 15 },
        { id: 'large', name: '大件物品', growTime: 300, baseValue: 60, exp: 30 },
        { id: 'fragile', name: '易碎品', growTime: 240, baseValue: 80, exp: 40 },
        { id: 'express', name: '特快件', growTime: 30, baseValue: 50, exp: 25 },
        { id: 'cold', name: '冷链货物', growTime: 120, baseValue: 100, exp: 50 },
        { id: 'valuable', name: '贵重物品', growTime: 600, baseValue: 200, exp: 100 }
    ],

    // 商品列表
    shopItems: [
        { id: 'protection_shield', name: '防护盾', price: 50, currency: 'coins', desc: '保护货物不被截胡', category: 'props' },
        { id: 'speed_up', name: '加速卡', price: 80, currency: 'coins', desc: '货物处理时间减半', category: 'props' },
        { id: 'broadcast', name: '广播喇叭', price: 20, currency: 'coins', desc: '世界聊天使用', category: 'props' },
        { id: 'steal_card', name: '截胡卡', price: 100, currency: 'coins', desc: '提高截胡成功率50%', category: 'props' },
        { id: 'fertilizer', name: '高效肥料', price: 30, currency: 'coins', desc: '货物价值提升20%', category: 'props' },
        { id: 'slot_expand', name: '货位扩展', price: 500, currency: 'diamonds', desc: '永久增加1个货位', category: 'special' },
        { id: 'vip_card', name: 'VIP周卡', price: 200, currency: 'diamonds', desc: '7天收益提升50%', category: 'special' },
        { id: 'rename_card', name: '改名卡', price: 500, currency: 'diamonds', desc: '修改一次昵称', category: 'special' },
        { id: 'transfer_card', name: '转区卡', price: 1000, currency: 'diamonds', desc: '更换所属分拨中心', category: 'special' }
    ],

    // 新手礼包
    newUserGifts: {
        coins: 1000,
        diamonds: 50,
        items: [
            { id: 'protection_shield', name: '防护盾', count: 5, desc: '保护货物不被截胡' },
            { id: 'speed_up', name: '加速卡', count: 3, desc: '货物处理时间减半' },
            { id: 'broadcast', name: '广播喇叭', count: 10, desc: '世界聊天使用' },
            { id: 'steal_card', name: '截胡卡', count: 2, desc: '提高截胡成功率' }
        ]
    },

    // 升级相关
    levelUpExpMultiplier: 100, // 升级所需经验 = 等级 * 100
    levelUpCoinMultiplier: 50, // 升级奖励 = 等级 * 50
    initialSlots: 6, // 初始货位数
    maxSlots: 12, // 最大货位数
    slotsPerLevelMilestone: 5, // 每5级增加1个货位

    // 截胡相关
    stealRatio: 0.3, // 截胡获得货物价值的30%

    // 成就配置
    achievements: {
        // 新手成就
        beginner: [
            { id: 'first_register', name: '初次见面', desc: '完成注册', reward: { diamonds: 10, coins: 100 }, type: '新手' },
            { id: 'first_harvest', name: '首次收取', desc: '收取第一批货物', reward: { diamonds: 5, coins: 50 }, type: '新手' },
            { id: 'first_steal', name: '初次截胡', desc: '第一次截胡好友货物', reward: { diamonds: 10, coins: 100 }, type: '新手' }
        ],
        // 成长成就
        growth: [
            { id: 'level_5', name: '物流新秀', desc: '等级达到5级', reward: { diamonds: 20, coins: 200 }, type: '成长' },
            { id: 'level_10', name: '站场经理', desc: '等级达到10级', reward: { diamonds: 50, coins: 500 }, type: '成长' },
            { id: 'level_20', name: '物流专家', desc: '等级达到20级', reward: { diamonds: 100, coins: 1000 }, type: '成长' },
            { id: 'steal_10', name: '新手小偷', desc: '累计截胡10次', reward: { diamonds: 15, coins: 150 }, type: '成长' },
            { id: 'steal_50', name: '截胡达人', desc: '累计截胡50次', reward: { diamonds: 40, coins: 400 }, type: '成长' },
            { id: 'steal_100', name: '截胡大师', desc: '累计截胡100次', reward: { diamonds: 80, coins: 800 }, type: '成长' }
        ],
        // 社交成就
        social: [
            { id: 'friend_5', name: '交友广阔', desc: '添加5个好友', reward: { diamonds: 20, coins: 200 }, type: '社交' },
            { id: 'chat_10', name: '聊天达人', desc: '发送10条聊天消息', reward: { diamonds: 10, coins: 100 }, type: '社交' },
            { id: 'branch_active', name: '分拨活跃', desc: '在分拨频道发言20次', reward: { diamonds: 25, coins: 250 }, type: '社交' }
        ],
        // 财富成就
        wealth: [
            { id: 'earn_10000', name: '万元户', desc: '累计获得10000金币', reward: { diamonds: 30, coins: 300 }, type: '财富' },
            { id: 'earn_50000', name: '金币大亨', desc: '累计获得50000金币', reward: { diamonds: 80, coins: 800 }, type: '财富' },
            { id: 'earn_100000', name: '物流富豪', desc: '累计获得100000金币', reward: { diamonds: 150, coins: 1500 }, type: '财富' }
        ]
    },

    // 签到奖励配置（连续签到）
    checkInRewards: [
        { day: 1, diamonds: 5, coins: 50, desc: '第1天', bonus: '新手奖励' },
        { day: 2, diamonds: 10, coins: 100, desc: '第2天', bonus: '坚持奖励' },
        { day: 3, diamonds: 15, coins: 150, desc: '第3天', bonus: '努力奖励' },
        { day: 4, diamonds: 20, coins: 200, desc: '第4天', bonus: '进步奖励' },
        { day: 5, diamonds: 25, coins: 250, desc: '第5天', bonus: '勤奋奖励' },
        { day: 6, diamonds: 30, coins: 300, desc: '第6天', bonus: '坚持奖励' },
        { day: 7, diamonds: 50, coins: 500, desc: '第7天', bonus: '周奖励' },
        { day: 14, diamonds: 100, coins: 800, desc: '第14天', bonus: '双周奖励' },
        { day: 30, diamonds: 200, coins: 1500, desc: '第30天', bonus: '月奖励' }
    ],

    // 连续签到额外奖励
    consecutiveBonus: {
        7: { diamonds: 50, coins: 300, item: 'protection_shield', itemCount: 2 },  // 7天额外奖励
        14: { diamonds: 100, coins: 500, item: 'speed_up', itemCount: 3 },  // 14天额外奖励
        30: { diamonds: 200, coins: 1000, item: 'broadcast', itemCount: 5 }  // 30天额外奖励
    },

    // 任务配置
    tasks: {
        // 每日任务
        daily: [
            { id: 'daily_harvest_5', name: '勤劳致富', desc: '收取5次货物', target: 5, reward: { diamonds: 5, coins: 100 }, type: 'daily' },
            { id: 'daily_steal_3', name: '截胡高手', desc: '截胡3次好友货物', target: 3, reward: { diamonds: 8, coins: 150 }, type: 'daily' },
            { id: 'daily_chat_5', name: '社交达人', desc: '发送5条聊天消息', target: 5, reward: { diamonds: 5, coins: 50 }, type: 'daily' }
        ],
        // 周常任务
        weekly: [
            { id: 'weekly_level_2', name: '等级提升', desc: '本周等级提升2级', target: 2, reward: { diamonds: 25, coins: 300 }, type: 'weekly' },
            { id: 'weekly_steal_20', name: '截胡狂人', desc: '本周累计截胡20次', target: 20, reward: { diamonds: 30, coins: 400 }, type: 'weekly' },
            { id: 'weekly_harvest_50', name: '收货专家', desc: '本周累计收取50次货物', target: 50, reward: { diamonds: 25, coins: 350 }, type: 'weekly' }
        ],
        // 挑战任务
        challenge: [
            { id: 'challenge_login_7', name: '坚持就是胜利', desc: '连续登录7天', target: 7, reward: { diamonds: 50, coins: 500 }, type: 'challenge' },
            { id: 'challenge_items_100', name: '道具收藏家', desc: '拥有100个道具', target: 100, reward: { diamonds: 40, coins: 400 }, type: 'challenge' },
            { id: 'challenge_slots_12', name: '站场扩建', desc: '解锁全部12个货位', target: 12, reward: { diamonds: 60, coins: 600 }, type: 'challenge' }
        ]
    }
};

// 获取分拨信息
function getBranchById(branchId) {
    return CONFIG.branches.find(b => b.id === branchId);
}

// 获取货物类型信息
function getCargoTypeById(cargoId) {
    return CONFIG.cargoTypes.find(c => c.id === cargoId);
}

// 获取商品信息
function getShopItemById(itemId) {
    return CONFIG.shopItems.find(i => i.id === itemId);
}

// 计算升级所需经验
function getLevelUpExp(level) {
    return level * CONFIG.levelUpExpMultiplier;
}

// 计算货位数量
function getStationSlots(level) {
    return Math.min(CONFIG.maxSlots, CONFIG.initialSlots + Math.floor(level / CONFIG.slotsPerLevelMilestone));
}

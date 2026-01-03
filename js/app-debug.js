// 主应用逻辑 - 调试版本
const App = {
    // 当前用户信息
    currentUser: null,

    // 定时器
    timers: {
        cargo: null,
        chat: null
    },

    // 当前选中的货位
    selectedSlotIndex: -1,
    selectedCargo: null,

    // 当前聊天类型
    chatType: 'branch',

    // 调试日志
    debugLog: function(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const color = type === 'error' ? '#c62828' : type === 'success' ? '#2e7d32' : '#1565c0';
        console.log(`[${timestamp}] %c${message}`, `color: ${color}`);

        // 显示在页面上
        const debugPanel = document.getElementById('debug-panel');
        if (debugPanel) {
            const entry = document.createElement('div');
            entry.style.color = color;
            entry.textContent = `[${timestamp}] ${message}`;
            debugPanel.appendChild(entry);
            debugPanel.scrollTop = debugPanel.scrollHeight;
        }
    },

    // 初始化
    init() {
        this.debugLog('App.init() 开始执行');
        try {
            this.bindEvents();
            this.debugLog('事件绑定完成');
            this.checkLogin();
            this.debugLog('初始化完成');
        } catch (e) {
            this.debugLog(`初始化错误: ${e.message}`, 'error');
            console.error(e);
        }
    },

    // 绑定事件
    bindEvents() {
        this.debugLog('开始绑定事件...');

        // 登录页面
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                this.debugLog('登录按钮被点击');
                this.handleLogin();
            });
            this.debugLog('登录按钮事件绑定成功');
        } else {
            this.debugLog('登录按钮未找到', 'error');
        }

        // 注册页面
        const confirmBranchBtn = document.getElementById('confirm-branch-btn');
        if (confirmBranchBtn) {
            confirmBranchBtn.addEventListener('click', () => {
                this.debugLog('确认注册按钮被点击');
                this.handleRegister();
            });
            this.debugLog('确认注册按钮事件绑定成功');
        } else {
            this.debugLog('确认注册按钮未找到', 'error');
        }

        // 主页面导航
        const tabItems = document.querySelectorAll('.tab-item');
        if (tabItems.length > 0) {
            tabItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    const page = e.currentTarget.dataset.page;
                    this.debugLog(`导航到页面: ${page}`);
                    this.switchToPage(page);
                });
            });
            this.debugLog(`绑定了 ${tabItems.length} 个导航按钮`);
        } else {
            this.debugLog('导航按钮未找到', 'error');
        }

        // 快捷操作按钮
        const harvestAllBtn = document.getElementById('harvest-all-btn');
        if (harvestAllBtn) {
            harvestAllBtn.addEventListener('click', () => {
                this.debugLog('一键收取按钮被点击');
                this.harvestAll();
            });
        }

        // 货物选择弹窗
        const cargoModal = document.getElementById('cargo-modal');
        if (cargoModal) {
            cargoModal.addEventListener('click', (e) => {
                if (e.target === cargoModal || e.target.classList.contains('modal-overlay')) {
                    Utils.hideModal('cargo-modal');
                }
            });

            const closeBtn = cargoModal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => Utils.hideModal('cargo-modal'));
            }
        }

        this.debugLog('事件绑定完成');
    },

    // 检查登录状态
    checkLogin() {
        this.debugLog('检查登录状态...');
        setTimeout(() => {
            try {
                const userInfo = Storage.getUserInfo();
                if (userInfo) {
                    this.debugLog(`发现已登录用户: ${userInfo.nickname}`, 'success');
                    this.currentUser = userInfo;
                    this.switchPage('main-page');
                    this.initMainPage();
                } else {
                    this.debugLog('未发现已登录用户，显示登录页面');
                    this.switchPage('login-page');
                }
            } catch (e) {
                this.debugLog(`检查登录状态错误: ${e.message}`, 'error');
                console.error(e);
            }
        }, 1500);
    },

    // 处理登录
    handleLogin() {
        this.debugLog('处理登录...');
        const nickname = document.getElementById('nickname-input').value.trim();

        if (!nickname) {
            this.debugLog('昵称为空', 'error');
            Utils.showToast('请输入昵称', 'error');
            return;
        }

        if (nickname.length < 2 || nickname.length > 12) {
            this.debugLog('昵称长度不符合要求', 'error');
            Utils.showToast('昵称长度2-12个字符', 'error');
            return;
        }

        this.debugLog(`临时保存昵称: ${nickname}`);
        this.tempNickname = nickname;
        this.showBranchSelection();
    },

    // 显示分拨选择
    showBranchSelection() {
        this.debugLog('显示分拨选择页面');
        try {
            this.switchPage('register-page');
            const branchList = document.getElementById('branch-list');

            if (!branchList) {
                this.debugLog('分拨列表容器未找到', 'error');
                return;
            }

            branchList.innerHTML = '';
            CONFIG.branches.forEach(branch => {
                const item = document.createElement('div');
                item.className = 'branch-item';
                item.innerHTML = `
                    <div class="branch-name">${branch.name}</div>
                    <div class="branch-region">${branch.region}</div>
                `;
                item.addEventListener('click', () => {
                    document.querySelectorAll('.branch-item').forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                    this.selectedBranch = branch.id;
                    document.getElementById('confirm-branch-btn').disabled = false;
                    this.debugLog(`选择了分拨: ${branch.name}`);
                });
                branchList.appendChild(item);
            });
            this.debugLog(`加载了 ${CONFIG.branches.length} 个分拨`, 'success');
        } catch (e) {
            this.debugLog(`显示分拨选择错误: ${e.message}`, 'error');
            console.error(e);
        }
    },

    // 处理注册
    async handleRegister() {
        this.debugLog('开始注册流程...');

        if (!this.selectedBranch) {
            this.debugLog('未选择分拨', 'error');
            Utils.showToast('请选择分拨', 'error');
            return;
        }

        this.debugLog(`注册参数: nickname=${this.tempNickname}, branch=${this.selectedBranch}`);

        try {
            const result = await userApi.register({
                nickname: this.tempNickname,
                branchId: this.selectedBranch
            });

            this.debugLog(`注册结果: ${JSON.stringify(result)}`);

            if (result.success) {
                this.currentUser = result.data;
                this.debugLog(`注册成功，用户ID: ${this.currentUser.userId}`, 'success');

                Utils.showToast('注册成功！获得新手礼包', 'success');

                setTimeout(() => {
                    this.debugLog('准备切换到主页面');
                    try {
                        this.switchPage('main-page');
                        this.debugLog('已切换到主页面');
                        this.initMainPage();
                        this.debugLog('主页面初始化完成', 'success');
                    } catch (e) {
                        this.debugLog(`切换页面错误: ${e.message}`, 'error');
                        console.error(e);
                    }
                }, 1000);
            } else {
                this.debugLog(`注册失败: ${result.message}`, 'error');
                Utils.showToast(result.message || '注册失败', 'error');
            }
        } catch (e) {
            this.debugLog(`注册异常: ${e.message}`, 'error');
            console.error(e);
            Utils.showToast('注册异常，请检查控制台', 'error');
        }
    },

    // 初始化主页面
    initMainPage() {
        this.debugLog('初始化主页面...');
        try {
            this.updateUserInfo();
            this.debugLog('用户信息更新完成');
            this.loadStationCargos();
            this.debugLog('站场货物加载完成');
            this.startCargoTimer();
            this.debugLog('定时器启动完成', 'success');
        } catch (e) {
            this.debugLog(`主页面初始化错误: ${e.message}`, 'error');
            console.error(e);
        }
    },

    // 更新用户信息显示
    updateUserInfo() {
        if (!this.currentUser) {
            this.debugLog('当前用户为空，跳过更新', 'warning');
            return;
        }

        this.debugLog(`更新用户信息显示: ${this.currentUser.nickname}`);

        try {
            const nicknameEl = document.getElementById('user-nickname');
            const levelEl = document.getElementById('user-level');
            const coinsEl = document.getElementById('user-coins');
            const diamondsEl = document.getElementById('user-diamonds');
            const branchEl = document.getElementById('branch-name');
            const expFillEl = document.getElementById('exp-fill');
            const slotInfoEl = document.getElementById('slot-info');
            const avatarEl = document.getElementById('user-avatar');

            if (nicknameEl) nicknameEl.textContent = this.currentUser.nickname;
            if (levelEl) levelEl.textContent = `Lv.${this.currentUser.level}`;
            if (coinsEl) coinsEl.textContent = this.currentUser.coins;
            if (diamondsEl) diamondsEl.textContent = this.currentUser.diamonds;
            if (branchEl) branchEl.textContent = this.currentUser.branchName;

            if (expFillEl) {
                const expPercent = (this.currentUser.exp / getLevelUpExp(this.currentUser.level)) * 100;
                expFillEl.style.width = expPercent + '%';
            }

            if (slotInfoEl) {
                const slots = getStationSlots(this.currentUser.level);
                slotInfoEl.textContent = `货位 ${this.currentUser.stationSlots}/${slots}`;
            }

            if (avatarEl && this.currentUser.avatar) {
                avatarEl.src = this.currentUser.avatar;
            }

            this.debugLog('用户信息显示更新完成', 'success');
        } catch (e) {
            this.debugLog(`更新用户信息显示错误: ${e.message}`, 'error');
            console.error(e);
        }
    },

    // 加载站场货物
    async loadStationCargos() {
        if (!this.currentUser) {
            this.debugLog('当前用户为空，跳过加载', 'warning');
            return;
        }

        this.debugLog('开始加载站场货物...');

        try {
            const result = await stationApi.getStationCargos(this.currentUser.userId);
            this.debugLog(`货物加载结果: ${result.success ? '成功' : '失败'}`);

            if (result.success) {
                this.currentCargos = result.data;
                this.debugLog(`货物数量: ${result.data.length}`);
                this.renderCargoGrid(result.data);
                this.debugLog('货物网格渲染完成', 'success');
            } else {
                this.debugLog(`加载货物失败: ${result.message}`, 'error');
            }
        } catch (e) {
            this.debugLog(`加载站场货物错误: ${e.message}`, 'error');
            console.error(e);
        }
    },

    // 渲染货物网格
    renderCargoGrid(cargos) {
        this.debugLog('开始渲染货物网格...');

        try {
            const grid = document.getElementById('cargo-grid');
            if (!grid) {
                this.debugLog('货物网格容器未找到', 'error');
                return;
            }

            grid.innerHTML = '';

            const slotCount = this.currentUser.stationSlots;
            const now = Date.now();

            this.debugLog(`开始渲染 ${slotCount} 个货位`);

            for (let i = 0; i < slotCount; i++) {
                const slot = document.createElement('div');
                slot.className = 'cargo-slot';
                slot.dataset.index = i;

                const cargo = cargos.find(c => c.slotIndex === i);

                if (cargo) {
                    slot.classList.add('has-cargo');
                    const elapsed = now - cargo.startTime;
                    const progress = Math.min(100, (elapsed / cargo.growTime) * 100);
                    const remain = Math.max(0, cargo.growTime - elapsed);
                    const status = remain <= 0 ? 'ready' : 'growing';

                    if (status === 'ready') {
                        slot.classList.add('ready');
                    }

                    if (cargo.isProtected) {
                        slot.classList.add('protected');
                    }

                    slot.innerHTML = `
                        <div class="cargo-content">
                            <div class="cargo-icon">📦</div>
                            <div class="cargo-name">${cargo.typeName}</div>
                            ${status === 'growing' ? `
                                <div class="progress-section">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${progress}%"></div>
                                    </div>
                                    <div class="remain-time">${Utils.formatRemainTime(remain)}</div>
                                </div>
                            ` : `
                                <div class="ready-badge">可收取</div>
                            `}
                            ${cargo.isProtected ? `
                                <div class="protected-badge">🛡️</div>
                            ` : ''}
                        </div>
                    `;
                } else {
                    slot.innerHTML = `
                        <div class="empty-slot">
                            <div>➕</div>
                            <div>放置货物</div>
                        </div>
                    `;
                }

                slot.addEventListener('click', (e) => this.onSlotClick(parseInt(e.currentTarget.dataset.index), cargo));
                grid.appendChild(slot);
            }

            this.debugLog('货物网格渲染完成', 'success');
        } catch (e) {
            this.debugLog(`渲染货物网格错误: ${e.message}`, 'error');
            console.error(e);
        }
    },

    // 货位点击事件
    onSlotClick(index, cargo) {
        this.debugLog(`货位点击: ${index}, cargo: ${cargo ? cargo.typeName : '空'}`);

        if (!cargo) {
            this.selectedSlotIndex = index;
            this.showCargoSelection();
        } else {
            this.selectedSlotIndex = index;
            this.selectedCargo = cargo;
            this.showActionMenu(cargo);
        }
    },

    // 显示货物选择
    showCargoSelection() {
        this.debugLog('显示货物选择弹窗');
        const list = document.getElementById('cargo-type-list');
        if (!list) {
            this.debugLog('货物选择列表未找到', 'error');
            return;
        }

        list.innerHTML = '';
        CONFIG.cargoTypes.forEach(type => {
            const item = document.createElement('div');
            item.className = 'cargo-option';
            item.innerHTML = `
                <div class="cargo-img">📦</div>
                <div class="cargo-info">
                    <div class="cargo-name">${type.name}</div>
                    <div class="cargo-desc">耗时: ${Utils.formatGrowTime(type.growTime)} | 收益: ${type.baseValue}金币</div>
                </div>
                <div class="cargo-exp">+${type.exp}经验</div>
            `;
            item.addEventListener('click', () => this.placeCargo(type.id));
            list.appendChild(item);
        });

        Utils.showModal('cargo-modal');
        this.debugLog('货物选择弹窗显示完成', 'success');
    },

    // 放置货物
    async placeCargo(cargoTypeId) {
        if (!this.currentUser) {
            this.debugLog('当前用户为空', 'error');
            return;
        }

        this.debugLog(`放置货物: ${cargoTypeId} 到货位 ${this.selectedSlotIndex}`);

        try {
            const result = await stationApi.placeCargo(this.currentUser.userId, this.selectedSlotIndex, cargoTypeId);
            if (result.success) {
                this.debugLog('放置成功', 'success');
                Utils.showToast('放置成功', 'success');
                Utils.hideModal('cargo-modal');
                this.loadStationCargos();
            } else {
                this.debugLog(`放置失败: ${result.message}`, 'error');
                Utils.showToast(result.message || '放置失败', 'error');
            }
        } catch (e) {
            this.debugLog(`放置货物错误: ${e.message}`, 'error');
            console.error(e);
        }
    },

    // 显示操作菜单
    showActionMenu(cargo) {
        this.debugLog(`显示操作菜单: ${cargo.typeName}`);
        const menu = document.getElementById('action-menu');
        if (!menu) {
            this.debugLog('操作菜单未找到', 'error');
            return;
        }

        menu.innerHTML = '';

        const now = Date.now();
        const isReady = now - cargo.startTime >= cargo.growTime;

        if (isReady) {
            const harvestItem = document.createElement('div');
            harvestItem.className = 'action-item';
            harvestItem.innerHTML = `
                <div>收取</div>
                <div>💰 ${cargo.value}金币</div>
            `;
            harvestItem.addEventListener('click', () => this.harvestCargo());
            menu.appendChild(harvestItem);
        } else {
            const speedItem = document.createElement('div');
            speedItem.className = 'action-item';
            speedItem.innerHTML = `
                <div>使用加速卡</div>
                <div>⚡ 时间减半</div>
            `;
            speedItem.addEventListener('click', () => this.useSpeedUp());
            menu.appendChild(speedItem);
        }

        if (!cargo.isProtected) {
            const shieldItem = document.createElement('div');
            shieldItem.className = 'action-item';
            shieldItem.innerHTML = `
                <div>使用防护盾</div>
                <div>🛡️ 防止截胡</div>
            `;
            shieldItem.addEventListener('click', () => this.useShield());
            menu.appendChild(shieldItem);
        }

        const cancelItem = document.createElement('div');
        cancelItem.className = 'action-item cancel';
        cancelItem.innerHTML = '<div>取消</div>';
        cancelItem.addEventListener('click', () => Utils.hideModal('action-modal'));
        menu.appendChild(cancelItem);

        Utils.showModal('action-modal');
        this.debugLog('操作菜单显示完成', 'success');
    },

    // 收取货物
    async harvestCargo() {
        if (!this.currentUser || !this.selectedCargo) {
            this.debugLog('当前用户或货物为空', 'error');
            return;
        }

        this.debugLog(`收取货物: ${this.selectedCargo.id}`);

        try {
            const result = await stationApi.harvestCargo(this.currentUser.userId, this.selectedCargo.id);
            if (result.success) {
                this.debugLog(`收取成功，获得 ${result.data.coins} 金币`, 'success');
                Utils.showToast(`获得 ${result.data.coins} 金币！`, 'success');
                await userApi.addExp(this.currentUser.userId, result.data.exp);
                this.currentUser = Storage.getUserInfo();
                this.updateUserInfo();
                Utils.hideModal('action-modal');
                this.loadStationCargos();
            } else {
                this.debugLog(`收取失败: ${result.message}`, 'error');
                Utils.showToast(result.message || '收取失败', 'error');
            }
        } catch (e) {
            this.debugLog(`收取货物错误: ${e.message}`, 'error');
            console.error(e);
        }
    },

    // 使用加速卡
    async useSpeedUp() {
        if (!this.currentUser || !this.selectedCargo) {
            this.debugLog('当前用户或货物为空', 'error');
            return;
        }

        this.debugLog(`使用加速卡: ${this.selectedCargo.id}`);

        try {
            const result = await stationApi.useSpeedUp(this.currentUser.userId, this.selectedCargo.id);
            if (result.success) {
                this.debugLog('加速成功', 'success');
                Utils.showToast('加速成功', 'success');
                this.currentUser = Storage.getUserInfo();
                this.updateUserInfo();
                Utils.hideModal('action-modal');
                this.loadStationCargos();
            } else {
                this.debugLog(`加速失败: ${result.message}`, 'error');
                Utils.showToast(result.message || '加速失败', 'error');
            }
        } catch (e) {
            this.debugLog(`使用加速卡错误: ${e.message}`, 'error');
            console.error(e);
        }
    },

    // 使用防护盾
    async useShield() {
        if (!this.currentUser || !this.selectedCargo) {
            this.debugLog('当前用户或货物为空', 'error');
            return;
        }

        this.debugLog(`使用防护盾: ${this.selectedCargo.id}`);

        try {
            const result = await stationApi.useProtectionShield(this.currentUser.userId, this.selectedCargo.id);
            if (result.success) {
                this.debugLog('防护盾使用成功', 'success');
                Utils.showToast('防护盾已生效', 'success');
                this.currentUser = Storage.getUserInfo();
                this.updateUserInfo();
                Utils.hideModal('action-modal');
                this.loadStationCargos();
            } else {
                this.debugLog(`使用防护盾失败: ${result.message}`, 'error');
                Utils.showToast(result.message || '使用失败', 'error');
            }
        } catch (e) {
            this.debugLog(`使用防护盾错误: ${e.message}`, 'error');
            console.error(e);
        }
    },

    // 一键收取
    async harvestAll() {
        if (!this.currentUser) {
            this.debugLog('当前用户为空', 'error');
            return;
        }

        this.debugLog('开始一键收取...');

        try {
            const result = await stationApi.getStationCargos(this.currentUser.userId);
            if (!result.success) return;

            const now = Date.now();
            const readyCargos = result.data.filter(c => now - c.startTime >= c.growTime);

            if (readyCargos.length === 0) {
                this.debugLog('没有可收取的货物');
                Utils.showToast('没有可收取的货物');
                return;
            }

            this.debugLog(`可收取货物数量: ${readyCargos.length}`);

            let totalCoins = 0;
            let totalExp = 0;

            for (const cargo of readyCargos) {
                const harvestResult = await stationApi.harvestCargo(this.currentUser.userId, cargo.id);
                if (harvestResult.success) {
                    totalCoins += harvestResult.data.coins;
                    totalExp += harvestResult.data.exp;
                }
            }

            if (totalExp > 0) {
                await userApi.addExp(this.currentUser.userId, totalExp);
            }

            this.debugLog(`一键收取完成，获得 ${totalCoins} 金币`, 'success');
            Utils.showToast(`收取完成！获得 ${totalCoins} 金币`, 'success');
            this.currentUser = Storage.getUserInfo();
            this.updateUserInfo();
            this.loadStationCargos();
        } catch (e) {
            this.debugLog(`一键收取错误: ${e.message}`, 'error');
            console.error(e);
        }
    },

    // 启动货物定时器
    startCargoTimer() {
        this.debugLog('启动货物定时器');
        this.stopCargoTimer();
        this.timers.cargo = setInterval(() => {
            if (this.currentUser && document.getElementById('main-page')?.classList.contains('active')) {
                this.updateCargoProgress();
            }
        }, 1000);
    },

    // 停止货物定时器
    stopCargoTimer() {
        if (this.timers.cargo) {
            clearInterval(this.timers.cargo);
            this.timers.cargo = null;
        }
    },

    // 更新货物进度
    updateCargoProgress() {
        const slots = document.querySelectorAll('.cargo-slot.has-cargo');
        const now = Date.now();

        slots.forEach(slot => {
            const index = parseInt(slot.dataset.index);
            const cargo = this.currentCargos?.find(c => c.slotIndex === index);

            if (cargo) {
                const elapsed = now - cargo.startTime;
                const progress = Math.min(100, (elapsed / cargo.growTime) * 100);
                const remain = Math.max(0, cargo.growTime - elapsed);
                const status = remain <= 0 ? 'ready' : 'growing';

                if (status === 'ready') {
                    slot.classList.add('ready');
                    const content = slot.querySelector('.cargo-content');
                    if (content && !content.querySelector('.ready-badge')) {
                        const progressSection = content.querySelector('.progress-section');
                        if (progressSection) {
                            progressSection.innerHTML = '<div class="ready-badge">可收取</div>';
                        }
                    }
                } else {
                    const progressFill = slot.querySelector('.progress-fill');
                    const remainTime = slot.querySelector('.remain-time');
                    if (progressFill) {
                        progressFill.style.width = progress + '%';
                    }
                    if (remainTime) {
                        remainTime.textContent = Utils.formatRemainTime(remain);
                    }
                }
            }
        });
    },

    // 页面切换
    switchToPage(page) {
        this.debugLog(`切换页面: ${page}`);
        const pageMap = {
            'station': 'main-page',
            'friend': 'friend-page',
            'chat': 'chat-page',
            'shop': 'shop-page',
            'profile': 'profile-page',
            'ranking': 'ranking-page'
        };

        const pageId = pageMap[page];
        if (!pageId) {
            this.debugLog(`未知页面: ${page}`, 'error');
            return;
        }

        this.switchPage(pageId);

        // 根据页面初始化数据
        switch (page) {
            case 'friend':
                this.loadFriends();
                break;
            case 'chat':
                this.loadChatMessages();
                this.startChatTimer();
                break;
            case 'shop':
                this.loadShop();
                break;
            case 'profile':
                this.loadProfile();
                break;
            case 'ranking':
                this.loadRanking();
                break;
        }
    },

    // 切换页面（内部方法）
    switchPage(pageId) {
        this.debugLog(`执行页面切换: ${pageId}`);
        try {
            const pages = document.querySelectorAll('.page');
            pages.forEach(page => {
                page.classList.remove('active');
            });

            const targetPage = document.getElementById(pageId);
            if (targetPage) {
                targetPage.classList.add('active');
                this.debugLog(`页面 ${pageId} 已激活`, 'success');
            } else {
                this.debugLog(`目标页面 ${pageId} 未找到`, 'error');
            }
        } catch (e) {
            this.debugLog(`切换页面错误: ${e.message}`, 'error');
            console.error(e);
        }
    },

    // 加载好友
    async loadFriends() {
        if (!this.currentUser) return;

        const tabs = document.querySelectorAll('.friend-tab');
        const activeTab = Array.from(tabs).find(t => t.classList.contains('active'));
        const tabType = activeTab ? activeTab.dataset.tab : 'friends';

        const list = document.getElementById('friend-list');
        if (!list) return;
        list.innerHTML = '';

        if (tabType === 'friends') {
            const result = await friendApi.getFriendList(this.currentUser.userId);
            if (result.success && result.data.length > 0) {
                for (const friend of result.data) {
                    const memberResult = await friendApi.getBranchMembers(this.currentUser.branchId);
                    const member = memberResult.data.list.find(m => m.userId === friend.userId);

                    if (member) {
                        const item = this.createFriendItem(member);
                        list.appendChild(item);
                    }
                }
            } else {
                list.innerHTML = '<div class="empty-state"><div>👥</div><p>暂无好友</p></div>';
            }
        } else {
            const result = await friendApi.getBranchMembers(this.currentUser.branchId);
            if (result.success && result.data.list.length > 0) {
                result.data.list.forEach(member => {
                    if (member.userId !== this.currentUser.userId) {
                        const item = this.createFriendItem(member);
                        list.appendChild(item);
                    }
                });
            } else {
                list.innerHTML = '<div class="empty-state"><div>👥</div><p>暂无分拨成员</p></div>';
            }
        }
    },

    createFriendItem(member) {
        const item = document.createElement('div');
        item.className = 'friend-item';
        item.innerHTML = `
            <img class="avatar" src="${member.avatar || 'assets/default-avatar.svg'}" alt="${member.nickname}">
            <div class="friend-info">
                <div class="name">${member.nickname}</div>
                <div class="branch">Lv.${member.level}</div>
            </div>
            <button class="visit-btn">拜访</button>
        `;

        item.querySelector('.visit-btn').addEventListener('click', () => {
            this.visitFriendStation(member.userId);
        });

        return item;
    },

    // 添加好友
    async addFriend() {
        const targetUserId = prompt('请输入好友ID：');
        if (!targetUserId) return;

        const result = await friendApi.addFriend(this.currentUser.userId, targetUserId);
        if (result.success) {
            Utils.showToast('添加好友成功', 'success');
            this.loadFriends();
        } else {
            Utils.showToast(result.message || '添加失败', 'error');
        }
    },

    // 拜访好友
    visitFriend() {
        this.switchToPage('friend');
    },

    // 拜访好友站场
    async visitFriendStation(friendId) {
        const result = await stationApi.getStationCargos(friendId);
        if (result.success) {
            const readyCount = result.data.filter(c => Date.now() - c.startTime >= c.growTime && !c.isProtected).length;
            const total = result.data.length;

            if (total === 0) {
                Utils.showToast('好友站场空空如也');
                return;
            }

            if (readyCount === 0) {
                Utils.showToast('好友没有可截胡的货物');
                return;
            }

            const targetCargo = result.data.find(c => Date.now() - c.startTime >= c.growTime && !c.isProtected);
            if (targetCargo) {
                const stealResult = await stationApi.stealCargo(friendId, targetCargo.id);
                if (stealResult.success) {
                    Utils.showToast(stealResult.data.message, 'success');
                    this.currentUser = Storage.getUserInfo();
                    this.updateUserInfo();
                } else {
                    Utils.showToast(stealResult.message || '截胡失败', 'error');
                }
            }
        }
    },

    // 加载聊天消息
    async loadChatMessages() {
        if (!this.currentUser) return;

        const list = document.getElementById('message-list');
        const infoBar = document.getElementById('chat-info-bar');
        const infoText = document.getElementById('chat-info-text');

        if (!list || !infoText) return;

        list.innerHTML = '';

        if (this.chatType === 'branch') {
            const result = await chatApi.getBranchChatHistory(this.currentUser.branchId);
            if (result.success) {
                this.renderMessages(result.data, list);
                infoText.textContent = `${this.currentUser.branchName} · 在线 ${this.getOnlineCount()} 人`;
            }
        } else {
            const result = await chatApi.getWorldChatHistory();
            if (result.success) {
                this.renderMessages(result.data, list);
                const broadcastItem = this.currentUser.items.find(i => i.id === 'broadcast');
                const count = broadcastItem ? broadcastItem.count : 0;
                infoText.textContent = `发言需消耗广播喇叭（剩余：${count} 个）`;
            }
        }

        Utils.scrollToBottom(list);
    },

    // 渲染消息
    renderMessages(messages, container) {
        let lastTime = 0;

        messages.forEach(msg => {
            const showTime = Utils.shouldShowTime(msg.timestamp, lastTime);
            lastTime = msg.timestamp;

            const item = document.createElement('div');
            item.className = 'message-item';

            if (showTime) {
                const timeDiv = document.createElement('div');
                timeDiv.className = 'time-divider';
                timeDiv.innerHTML = `<span>${Utils.formatChatTime(msg.timestamp)}</span>`;
                item.appendChild(timeDiv);
            }

            const contentDiv = document.createElement('div');
            contentDiv.className = `message-content ${msg.userId === this.currentUser.userId ? 'self' : ''}`;

            if (msg.userId === this.currentUser.userId) {
                contentDiv.innerHTML = `
                    <div class="message-right">
                        <div class="message-body">
                            <div class="message-bubble self">${msg.content}</div>
                        </div>
                        <img class="avatar" src="${msg.avatar || 'assets/default-avatar.svg'}" alt="${msg.nickname}">
                    </div>
                `;
            } else {
                contentDiv.innerHTML = `
                    <div class="message-left">
                        <img class="avatar" src="${msg.avatar || 'assets/default-avatar.svg'}" alt="${msg.nickname}">
                        <div class="message-body">
                            <div class="message-header">
                                <span class="nickname">${msg.nickname}</span>
                                ${msg.branchName ? `<span class="branch-tag">[${msg.branchName}]</span>` : ''}
                            </div>
                            <div class="message-bubble">${msg.content}</div>
                        </div>
                    </div>
                `;
            }

            item.appendChild(contentDiv);
            container.appendChild(item);
        });
    },

    // 发送聊天消息
    async sendChatMessage() {
        const input = document.getElementById('chat-input');
        const content = input.value.trim();

        if (!content) {
            Utils.showToast('请输入消息内容', 'error');
            return;
        }

        let result;
        if (this.chatType === 'branch') {
            result = await chatApi.sendBranchMessage(this.currentUser.branchId, this.currentUser.userId, content);
        } else {
            result = await chatApi.sendWorldMessage(this.currentUser.userId, content);
        }

        if (result.success) {
            input.value = '';
            this.currentUser = Storage.getUserInfo();
            this.loadChatMessages();
        } else {
            Utils.showToast(result.message || '发送失败', 'error');
        }
    },

    // 启动聊天定时器
    startChatTimer() {
        this.stopChatTimer();
        this.timers.chat = setInterval(() => {
            if (document.getElementById('chat-page')?.classList.contains('active')) {
                this.loadChatMessages();
            }
        }, 5000);
    },

    // 停止聊天定时器
    stopChatTimer() {
        if (this.timers.chat) {
            clearInterval(this.timers.chat);
            this.timers.chat = null;
        }
    },

    // 获取在线人数（模拟）
    getOnlineCount() {
        return Math.floor(Math.random() * 20) + 5;
    },

    // 加载商城
    async loadShop() {
        if (!this.currentUser) return;

        const shopCoins = document.getElementById('shop-coins');
        const shopDiamonds = document.getElementById('shop-diamonds');

        if (shopCoins) shopCoins.textContent = this.currentUser.coins;
        if (shopDiamonds) shopDiamonds.textContent = this.currentUser.diamonds;

        const activeTab = document.querySelector('.shop-tab.active');
        const category = activeTab ? activeTab.dataset.category : 'props';

        const result = await shopApi.getShopItems(category);
        if (!result.success) return;

        const list = document.getElementById('shop-list');
        if (!list) return;
        list.innerHTML = '';

        result.data.forEach(item => {
            const ownItem = this.currentUser.items.find(i => i.id === item.id);
            const ownCount = ownItem ? ownItem.count : 0;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'shop-item card';
            itemDiv.innerHTML = `
                <div class="item-icon">📦</div>
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-desc">${item.desc}</div>
                    ${ownCount > 0 ? `<div class="item-own">已拥有: ${ownCount}</div>` : ''}
                </div>
                <div class="item-action">
                    <div class="item-price">
                        <img src="assets/icons/${item.currency}.svg" alt="${item.currency}">
                        <span>${item.price}</span>
                    </div>
                    <button class="buy-btn">购买</button>
                </div>
            `;

            itemDiv.querySelector('.buy-btn').addEventListener('click', () => this.showBuyModal(item));
            list.appendChild(itemDiv);
        });
    },

    // 显示购买弹窗
    showBuyModal(item) {
        this.selectedShopItem = item;

        const buyItemName = document.getElementById('buy-item-name');
        const buyItemDesc = document.getElementById('buy-item-desc');
        const buyCurrencyIcon = document.getElementById('buy-currency-icon');
        const qtyInput = document.getElementById('qty-input');
        const buyItemIcon = document.getElementById('buy-item-icon');

        if (buyItemName) buyItemName.textContent = `购买 ${item.name}`;
        if (buyItemDesc) buyItemDesc.textContent = item.desc;
        if (buyCurrencyIcon) buyCurrencyIcon.src = `assets/icons/${item.currency}.svg`;
        if (qtyInput) qtyInput.value = 1;
        if (buyItemIcon) buyItemIcon.src = `assets/items/${item.id}.svg`;

        this.updateBuyTotal();
        Utils.showModal('buy-modal');
    },

    // 更新购买总价
    updateBuyTotal() {
        if (!this.selectedShopItem) return;

        const qtyInput = document.getElementById('qty-input');
        const totalPriceValue = document.getElementById('total-price-value');

        if (qtyInput && totalPriceValue) {
            const qty = parseInt(qtyInput.value) || 1;
            const total = this.selectedShopItem.price * qty;
            totalPriceValue.textContent = total;
        }
    },

    // 确认购买
    async confirmBuy() {
        if (!this.currentUser || !this.selectedShopItem) return;

        const qtyInput = document.getElementById('qty-input');
        const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;

        const result = await shopApi.buyItem(this.currentUser.userId, this.selectedShopItem.id, qty);
        if (result.success) {
            Utils.showToast('购买成功', 'success');
            this.currentUser = Storage.getUserInfo();
            Utils.hideModal('buy-modal');
            this.loadShop();
        } else {
            Utils.showToast(result.message || '购买失败', 'error');
        }
    },

    // 加载个人中心
    loadProfile() {
        if (!this.currentUser) return;

        const profileNickname = document.getElementById('profile-nickname');
        const profileBranch = document.getElementById('profile-branch');
        const profileLevel = document.getElementById('profile-level');
        const profileCoins = document.getElementById('profile-coins');
        const profileDiamonds = document.getElementById('profile-diamonds');
        const itemsGrid = document.getElementById('items-grid');

        if (profileNickname) profileNickname.textContent = this.currentUser.nickname;
        if (profileBranch) profileBranch.textContent = this.currentUser.branchName;
        if (profileLevel) profileLevel.textContent = this.currentUser.level;
        if (profileCoins) profileCoins.textContent = this.currentUser.coins;
        if (profileDiamonds) profileDiamonds.textContent = this.currentUser.diamonds;

        if (itemsGrid) {
            itemsGrid.innerHTML = '';

            if (this.currentUser.items.length === 0) {
                itemsGrid.innerHTML = '<div class="empty-state"><div>📦</div><p>暂无道具</p></div>';
            } else {
                this.currentUser.items.forEach(item => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'item-cell';
                    itemDiv.innerHTML = `
                        <div>📦</div>
                        <div class="name">${item.name}</div>
                        <div class="count">${item.count}</div>
                    `;
                    itemsGrid.appendChild(itemDiv);
                });
            }
        }
    },

    // 加载排行榜
    async loadRanking() {
        const activeTab = document.querySelector('.ranking-tab.active');
        const type = activeTab ? activeTab.dataset.type : 'coins';

        const activeScope = document.querySelector('.scope-btn.active');
        const scope = activeScope ? activeScope.dataset.scope : 'all';

        let branchId = null;
        if (scope === 'branch' && this.currentUser) {
            branchId = this.currentUser.branchId;
        }

        const result = await rankingApi.getRanking(type, branchId);
        if (!result.success) return;

        const list = document.getElementById('ranking-list');
        if (!list) return;
        list.innerHTML = '';

        if (result.data.length === 0) {
            list.innerHTML = '<div class="empty-state"><div>🏆</div><p>暂无数据</p></div>';
            return;
        }

        result.data.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            let className = 'ranking-item';
            if (index === 0) className += ' top-1';
            else if (index === 1) className += ' top-2';
            else if (index === 2) className += ' top-3';

            itemDiv.className = className;
            itemDiv.innerHTML = `
                <div class="rank-num">${index + 1}</div>
                <img class="avatar" src="${item.avatar || 'assets/default-avatar.svg'}" alt="${item.nickname}">
                <div class="ranking-info">
                    <div class="name">${item.nickname}</div>
                    <div class="branch">${item.branchName || ''}</div>
                </div>
                <div class="ranking-value">${item.value}</div>
            `;
            list.appendChild(itemDiv);
        });
    },

    // 退出登录
    logout() {
        if (confirm('确定要退出登录吗？')) {
            this.stopCargoTimer();
            this.stopChatTimer();
            Storage.removeUserInfo();
            this.currentUser = null;
            this.switchPage('login-page');
            Utils.showToast('已退出登录');
            this.debugLog('用户退出登录');
        }
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成，开始初始化App');
    App.init();
});

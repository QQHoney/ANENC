// 主应用逻辑
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

    // 初始化
    init() {
        this.initAvatarManager();
        this.render();
    },

    initAvatarManager() {
        // 头像数据
        this.avatars = {
            boy: ['boy_1.png', 'boy_2.png', 'boy_3.png', 'boy_4.png'],
            girl: ['girl_1.png', 'girl_2.png', 'girl_3.png', 'girl_4.png'],
            animal: ['animal_1.png', 'animal_2.png', 'animal_3.png', 'animal_4.png']
        };

        // DOM 元素
        this.avatarModal = document.getElementById('avatar-modal');
        this.avatarGrid = document.getElementById('avatar-grid');
        this.avatarTabs = document.querySelectorAll('.avatar-tab');
        this.avatarUpload = document.getElementById('avatar-upload');

        // 绑定事件
        this.bindAvatarEvents();
    },

    bindAvatarEvents() {
        // 打开弹窗 (点击个人中心头像)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.profile-avatar') || e.target.closest('.user-left')) {
                // 只有在个人中心或主页点击头像时才打开
                if (document.getElementById('profile-page').classList.contains('active') ||
                    document.getElementById('main-page').classList.contains('active')) {
                    this.openAvatarModal();
                }
            }
        });

        // 关闭弹窗
        if (this.avatarModal) {
            const closeBtn = this.avatarModal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    Utils.hideModal('avatar-modal');
                };
            }
        }

        // 切换分类
        this.avatarTabs.forEach(tab => {
            tab.onclick = () => {
                this.avatarTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderAvatarGrid(tab.dataset.category);
            };
        });

        // 自定义上传
        if (this.avatarUpload) {
            this.avatarUpload.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        this.updateAvatar(e.target.result);
                        Utils.hideModal('avatar-modal');
                    };
                    reader.readAsDataURL(file);
                }
            };
        }
    },

    openAvatarModal() {
        Utils.showModal('avatar-modal');
        // Ensure a tab is active and grid is rendered
        const firstTab = this.avatarTabs[0];
        if (firstTab) {
            this.avatarTabs.forEach(t => t.classList.remove('active'));
            firstTab.classList.add('active');
            this.renderAvatarGrid(firstTab.dataset.category || 'boy'); // Default to 'boy' if dataset.category is missing
        } else {
            this.renderAvatarGrid('boy'); // Fallback if no tabs exist
        }
    },

    renderAvatarGrid(category) {
        if (!this.avatarGrid) return;
        this.avatarGrid.innerHTML = '';
        const list = this.avatars[category];

        if (!list) return;

        list.forEach(img => {
            const div = document.createElement('div');
            div.className = 'avatar-option';
            // 检查是否是当前头像
            if (this.currentUser && (this.currentUser.avatar === `assets/avatars/${img}` || this.currentUser.avatar === `assets/icons/${img}`)) {
                div.classList.add('selected');
            }

            div.innerHTML = `<img src="assets/avatars/${img}" onerror="this.src='assets/icons/default-avatar.svg'">`;

            div.onclick = () => {
                // 如果是默认头像，路径需要调整
                let avatarPath = img.includes('default') ? 'assets/icons/' + img : 'assets/avatars/' + img;
                this.updateAvatar(avatarPath);
                Utils.hideModal('avatar-modal');
            };
            this.avatarGrid.appendChild(div);
        });
    },

    updateAvatar(path) {
        if (!this.currentUser) return;
        this.currentUser.avatar = path;
        Storage.setUserInfo(this.currentUser);
        this.updateUserInfo();
        Utils.showToast('头像更新成功！', 'success');
        // Update all displayed avatars immediately
        document.querySelectorAll('.avatar, .profile-avatar').forEach(img => {
            img.src = this.currentUser.avatar || 'assets/icons/default-avatar.svg';
        });
    },

    // 编辑心情
    handleStatusEdit() {
        if (!this.currentUser) return;

        // 这里简单使用prompt，后期可以优化为弹窗
        const currentStatus = this.currentUser.status || '';
        const newStatus = prompt('发表你的今日心情：', currentStatus);

        if (newStatus !== null) {
            const trimmedStatus = newStatus.trim();
            if (trimmedStatus.length > 50) {
                Utils.showToast('心情内容不能超过50个字哦', 'error');
                return;
            }

            this.currentUser.status = trimmedStatus;
            Storage.setUserInfo(this.currentUser);
            this.updateUserInfo();
            Utils.showToast('心情发布成功！', 'success');
        }
    },

    render() {
        this.bindEvents();
        this.checkLogin();
    },

    // 绑定事件
    bindEvents() {
        // 登录页面
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.handleLogin());
        }

        // 注册页面
        const confirmBranchBtn = document.getElementById('confirm-branch-btn');
        if (confirmBranchBtn) {
            confirmBranchBtn.addEventListener('click', () => this.handleRegister());
        }

        // 主页面导航
        const tabItems = document.querySelectorAll('.tab-item');
        tabItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.switchToPage(page);
            });
        });

        // 快捷操作按钮
        const harvestAllBtn = document.getElementById('harvest-all-btn');
        if (harvestAllBtn) {
            harvestAllBtn.addEventListener('click', () => this.harvestAll());
        }

        const visitFriendBtn = document.getElementById('visit-friend-btn');
        if (visitFriendBtn) {
            visitFriendBtn.addEventListener('click', () => this.visitFriend());
        }

        const checkinBtn = document.getElementById('checkin-btn');
        if (checkinBtn) {
            checkinBtn.addEventListener('click', () => this.openCheckInPage());
        }

        const achievementBtn = document.getElementById('achievement-btn');
        if (achievementBtn) {
            achievementBtn.addEventListener('click', () => this.openAchievementPage());
        }

        const taskBtn = document.getElementById('task-btn');
        if (taskBtn) {
            taskBtn.addEventListener('click', () => this.openTaskPage());
        }

        const rankingBtn = document.getElementById('ranking-btn');
        if (rankingBtn) {
            rankingBtn.addEventListener('click', () => this.switchToPage('ranking'));
        }

        // 个人中心
        const goProfile = document.getElementById('go-profile');
        if (goProfile) {
            goProfile.addEventListener('click', () => this.switchToPage('profile'));
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // 编辑心情
        const editStatusBtn = document.querySelector('.edit-status-btn');
        const statusBubble = document.querySelector('.status-bubble');
        if (editStatusBtn) {
            editStatusBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleStatusEdit();
            });
        }
        if (statusBubble) {
            statusBubble.addEventListener('click', () => this.handleStatusEdit());
        }

        // 返回按钮
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const backTo = e.currentTarget.dataset.back;
                console.log('返回按钮被点击，目标:', backTo);
                if (backTo === 'main') {
                    this.switchToPage('main');
                }
            });
        });

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

        // 操作菜单弹窗
        const actionModal = document.getElementById('action-modal');
        if (actionModal) {
            actionModal.addEventListener('click', (e) => {
                if (e.target === actionModal || e.target.classList.contains('modal-overlay')) {
                    Utils.hideModal('action-modal');
                }
            });
        }

        // 购买弹窗
        const buyModal = document.getElementById('buy-modal');
        if (buyModal) {
            buyModal.addEventListener('click', (e) => {
                if (e.target === buyModal || e.target.classList.contains('modal-overlay')) {
                    Utils.hideModal('buy-modal');
                }
            });

            const closeBtn = buyModal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => Utils.hideModal('buy-modal'));
            }

            // 数量选择
            const qtyDecrease = document.getElementById('qty-decrease');
            const qtyIncrease = document.getElementById('qty-increase');
            const qtyInput = document.getElementById('qty-input');

            if (qtyDecrease) {
                qtyDecrease.addEventListener('click', () => {
                    const current = parseInt(qtyInput.value) || 1;
                    if (current > 1) {
                        qtyInput.value = current - 1;
                        this.updateBuyTotal();
                    }
                });
            }

            if (qtyIncrease) {
                qtyIncrease.addEventListener('click', () => {
                    const current = parseInt(qtyInput.value) || 1;
                    if (current < 99) {
                        qtyInput.value = current + 1;
                        this.updateBuyTotal();
                    }
                });
            }

            if (qtyInput) {
                qtyInput.addEventListener('input', () => {
                    let value = parseInt(qtyInput.value) || 1;
                    if (value < 1) value = 1;
                    if (value > 99) value = 99;
                    qtyInput.value = value;
                    this.updateBuyTotal();
                });
            }

            // 确认购买
            const confirmBuyBtn = document.getElementById('confirm-buy-btn');
            if (confirmBuyBtn) {
                confirmBuyBtn.addEventListener('click', () => this.confirmBuy());
            }
        }

        // 聊天页面
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-btn');
        if (chatInput && sendBtn) {
            sendBtn.addEventListener('click', () => this.sendChatMessage());
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendChatMessage();
                }
            });
        }

        // 聊天标签切换
        document.querySelectorAll('.chat-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.chat-tab').forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.chatType = e.currentTarget.dataset.type;
                this.loadChatMessages();
            });
        });

        // 好友页面
        const addFriendBtn = document.getElementById('add-friend-btn');
        if (addFriendBtn) {
            addFriendBtn.addEventListener('click', () => this.addFriend());
        }

        document.querySelectorAll('.friend-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.friend-tab').forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.loadFriends();
            });
        });

        // 商城页面
        document.querySelectorAll('.shop-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.loadShop();
            });
        });

        // 排行榜页面
        document.querySelectorAll('.ranking-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.ranking-tab').forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.loadRanking();
            });
        });

        document.querySelectorAll('.scope-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.scope-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.loadRanking();
            });
        });
    },

    // 检查登录状态
    checkLogin() {
        setTimeout(() => {
            const userInfo = Storage.getUserInfo();
            if (userInfo) {
                // 检查封号状态
                if (userInfo.isBanned) {
                    Utils.showToast('该账号已被封禁', 'error');
                    Utils.switchPage('login-page');
                    return;
                }

                this.currentUser = userInfo;
                Utils.switchPage('main-page');
                this.initMainPage();
            } else {
                Utils.switchPage('login-page');
            }
        }, 1500);
    },

    // 处理登录
    handleLogin() {
        const nickname = document.getElementById('nickname-input').value.trim();
        if (!nickname) {
            Utils.showToast('请输入昵称', 'error');
            return;
        }

        if (nickname.length < 2 || nickname.length > 12) {
            Utils.showToast('昵称长度2-12个字符', 'error');
            return;
        }

        // 保存临时数据
        this.tempNickname = nickname;
        this.showBranchSelection();
    },

    // 显示分拨选择
    showBranchSelection() {
        Utils.switchPage('register-page');
        const branchList = document.getElementById('branch-list');
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
            });
            branchList.appendChild(item);
        });
    },

    // 处理注册或转区
    async handleRegister() {
        if (!this.selectedBranch) {
            Utils.showToast('请选择分拨', 'error');
            return;
        }

        // 如果是转区操作
        if (this.isTransferring) {
            const branch = getBranchById(this.selectedBranch);

            // 消耗转区卡
            this.consumeItem('transfer_card', 1);

            // 更新用户信息
            this.currentUser.branchId = branch.id;
            this.currentUser.branchName = branch.name;
            Storage.setUserInfo(this.currentUser);

            // 重置状态
            this.isTransferring = false;
            document.getElementById('confirm-branch-btn').textContent = '进入游戏';

            Utils.showToast('转区成功！', 'success');

            // 返回个人中心
            Utils.switchPage('main-page');
            this.updateUserInfo();
            this.loadProfile();
            return;
        }

        const result = await userApi.register({
            nickname: this.tempNickname,
            branchId: this.selectedBranch
        });

        if (result.success) {
            this.currentUser = result.data;
            Utils.showToast('注册成功！获得新手礼包', 'success');

            // 初始化用户成就数据（注册成就已自动设置）
            await achievementApi.updateAchievementProgress(this.currentUser.userId, 'first_register');

            setTimeout(() => {
                Utils.switchPage('main-page');
                this.initMainPage();
            }, 1000);
        } else {
            Utils.showToast(result.message || '注册失败', 'error');
        }
    },

    // 初始化主页面
    initMainPage() {
        this.updateUserInfo();
        this.loadStationCargos();
        this.startCargoTimer();
        this.checkRewardsNotification();
    },

    // 检查并显示奖励通知
    async checkRewardsNotification() {
        if (!this.currentUser) return;

        // 检查可领取的成就
        const claimableAchievements = await achievementApi.getClaimableAchievements(this.currentUser.userId);
        if (claimableAchievements.data.length > 0) {
            Utils.showToast(`🎯 有 ${claimableAchievements.data.length} 个成就可领取！`);
            return;
        }

        // 检查签到
        const canCheckIn = await checkInApi.canCheckIn(this.currentUser.userId);
        if (canCheckIn.data.canCheckIn) {
            Utils.showToast('📅 今日还未签到，快去领取奖励！');
            return;
        }

        // 检查可领取的任务
        const claimableTasks = await taskApi.getClaimableTasks(this.currentUser.userId);
        const totalClaimable = claimableTasks.data.daily.length + claimableTasks.data.weekly.length + claimableTasks.data.challenge.length;
        if (totalClaimable > 0) {
            Utils.showToast(`🎁 有 ${totalClaimable} 个任务奖励可领取！`);
            return;
        }
    },

    // 更新用户信息显示
    updateUserInfo() {
        if (!this.currentUser) return;

        document.getElementById('user-nickname').textContent = this.currentUser.nickname;
        document.getElementById('user-level').textContent = `Lv.${this.currentUser.level}`;
        document.getElementById('user-coins').textContent = this.currentUser.coins;
        document.getElementById('user-diamonds').textContent = this.currentUser.diamonds;
        document.getElementById('branch-name').textContent = this.currentUser.branchName;

        // 更新经验条
        const expPercent = (this.currentUser.exp / getLevelUpExp(this.currentUser.level)) * 100;
        document.getElementById('exp-fill').style.width = expPercent + '%';

        // 更新货位信息
        const slots = getStationSlots(this.currentUser.level);
        document.getElementById('slot-info').textContent = `货位 ${this.currentUser.stationSlots}/${slots}`;

        // 更新头像
        const avatar = document.getElementById('user-avatar');
        if (avatar && this.currentUser.avatar) {
            avatar.src = this.currentUser.avatar;
        }
        const profileAvatar = document.querySelector('.profile-avatar');
        if (profileAvatar && this.currentUser.avatar) {
            profileAvatar.src = this.currentUser.avatar;
        }

        // 更新心情/状态
        const statusText = document.getElementById('profile-status-text');
        if (statusText) {
            statusText.textContent = this.currentUser.status || '点击这里发表你的今日心情...';
        }
    },

    // 加载站场货物
    async loadStationCargos() {
        if (!this.currentUser) return;

        const result = await stationApi.getStationCargos(this.currentUser.userId);
        if (result.success) {
            this.currentCargos = result.data;  // 保存到实例变量
            this.renderCargoGrid(result.data);
        }
    },

    // 渲染货物网格
    renderCargoGrid(cargos) {
        const grid = document.getElementById('cargo-grid');
        grid.innerHTML = '';

        const slotCount = this.currentUser.stationSlots;
        const now = Date.now();

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
                        <img class="cargo-icon" src="assets/icons/${cargo.typeId}.png" alt="${cargo.typeName}">
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
    },

    // 货位点击事件
    onSlotClick(index, cargo) {
        if (!cargo) {
            // 空货位，显示货物选择
            this.selectedSlotIndex = index;
            this.showCargoSelection();
        } else {
            // 有货物，显示操作菜单
            this.selectedSlotIndex = index;
            this.selectedCargo = cargo;
            this.showActionMenu(cargo);
        }
    },

    // 显示货物选择
    showCargoSelection() {
        const list = document.getElementById('cargo-type-list');
        list.innerHTML = '';

        CONFIG.cargoTypes.forEach(type => {
            const item = document.createElement('div');
            item.className = 'cargo-option';
            item.innerHTML = `
                <img class="cargo-img" src="assets/icons/${type.id}.png" alt="${type.name}">
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
    },

    // 放置货物
    async placeCargo(cargoTypeId) {
        if (!this.currentUser) return;

        const result = await stationApi.placeCargo(this.currentUser.userId, this.selectedSlotIndex, cargoTypeId);
        if (result.success) {
            Utils.showToast('放置成功', 'success');
            Utils.hideModal('cargo-modal');
            this.loadStationCargos();
        } else {
            Utils.showToast(result.message || '放置失败', 'error');
        }
    },

    // 显示操作菜单
    showActionMenu(cargo) {
        const menu = document.getElementById('action-menu');
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
    },

    // 收取货物
    async harvestCargo() {
        if (!this.currentUser || !this.selectedCargo) return;

        const result = await stationApi.harvestCargo(this.currentUser.userId, this.selectedCargo.id);
        if (result.success) {
            Utils.showToast(`获得 ${result.data.coins} 金币！`, 'success');
            await userApi.addExp(this.currentUser.userId, result.data.exp);
            this.currentUser = Storage.getUserInfo();
            this.updateUserInfo();
            Utils.hideModal('action-modal');
            this.loadStationCargos();

            // 检查成就进度
            await this.checkAchievementProgress('first_harvest');

            // 更新任务进度
            await this.updateTaskProgress('daily', 'daily_harvest_5', 1);
            await this.updateTaskProgress('weekly', 'weekly_harvest_50', 1);

            // 检查财富成就
            await this.checkWealthAchievements();

            // 检查等级成就
            await this.checkLevelAchievements();
        } else {
            Utils.showToast(result.message || '收取失败', 'error');
        }
    },

    // 使用加速卡
    async useSpeedUp() {
        if (!this.currentUser || !this.selectedCargo) return;

        const result = await stationApi.useSpeedUp(this.currentUser.userId, this.selectedCargo.id);
        if (result.success) {
            Utils.showToast('加速成功', 'success');
            this.currentUser = Storage.getUserInfo();
            this.updateUserInfo();
            Utils.hideModal('action-modal');
            this.loadStationCargos();
        } else {
            Utils.showToast(result.message || '加速失败', 'error');
        }
    },

    // 使用防护盾
    async useShield() {
        if (!this.currentUser || !this.selectedCargo) return;

        const result = await stationApi.useProtectionShield(this.currentUser.userId, this.selectedCargo.id);
        if (result.success) {
            Utils.showToast('防护盾已生效', 'success');
            this.currentUser = Storage.getUserInfo();
            this.updateUserInfo();
            Utils.hideModal('action-modal');
            this.loadStationCargos();
        } else {
            Utils.showToast(result.message || '使用失败', 'error');
        }
    },

    // 一键收取
    async harvestAll() {
        if (!this.currentUser) return;

        const result = await stationApi.getStationCargos(this.currentUser.userId);
        if (!result.success) return;

        const now = Date.now();
        const readyCargos = result.data.filter(c => now - c.startTime >= c.growTime);

        if (readyCargos.length === 0) {
            Utils.showToast('没有可收取的货物');
            return;
        }

        let totalCoins = 0;
        let totalExp = 0;
        let harvestCount = 0;

        for (const cargo of readyCargos) {
            const harvestResult = await stationApi.harvestCargo(this.currentUser.userId, cargo.id);
            if (harvestResult.success) {
                totalCoins += harvestResult.data.coins;
                totalExp += harvestResult.data.exp;
                harvestCount++;
            }
        }

        if (totalExp > 0) {
            await userApi.addExp(this.currentUser.userId, totalExp);
        }

        Utils.showToast(`收取完成！获得 ${totalCoins} 金币`, 'success');
        this.currentUser = Storage.getUserInfo();
        this.updateUserInfo();
        this.loadStationCargos();

        // 检查成就进度
        if (harvestCount > 0) {
            await this.checkAchievementProgress('first_harvest');

            // 更新任务进度
            await this.updateTaskProgress('daily', 'daily_harvest_5', harvestCount);
            await this.updateTaskProgress('weekly', 'weekly_harvest_50', harvestCount);

            // 检查财富成就
            await this.checkWealthAchievements();
        }
    },

    // 启动货物定时器
    startCargoTimer() {
        this.stopCargoTimer();
        this.timers.cargo = setInterval(() => {
            if (this.currentUser && document.getElementById('main-page').classList.contains('active')) {
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
        console.log('switchToPage 被调用，参数:', page);

        const pageMap = {
            'main': 'main-page',
            'station': 'main-page',
            'friend': 'friend-page',
            'chat': 'chat-page',
            'shop': 'shop-page',
            'profile': 'profile-page',
            'ranking': 'ranking-page',
            'achievement': 'achievement-page',
            'checkin': 'checkin-page',
            'task': 'task-page'
        };

        const pageId = pageMap[page];
        if (!pageId) {
            console.error('未知页面:', page);
            return;
        }

        console.log('切换到页面ID:', pageId);

        // 如果是子页面，显示弹窗式页面
        if (pageId !== 'main-page') {
            Utils.switchPage(pageId);
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
                case 'achievement':
                    this.loadAchievements();
                    break;
                case 'checkin':
                    this.loadCheckIn();
                    break;
                case 'task':
                    this.loadTasks();
                    break;
            }
        } else {
            Utils.switchPage(pageId);
            this.initMainPage();
        }
    },

    // 加载好友
    async loadFriends() {
        if (!this.currentUser) return;

        const tabs = document.querySelectorAll('.friend-tab');
        const activeTab = Array.from(tabs).find(t => t.classList.contains('active'));
        const tabType = activeTab ? activeTab.dataset.tab : 'friends';

        const list = document.getElementById('friend-list');
        list.innerHTML = '';

        if (tabType === 'friends') {
            const result = await friendApi.getFriendList(this.currentUser.userId);
            if (result.success && result.data.length > 0) {
                for (const friend of result.data) {
                    // 获取好友信息
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
            <img class="avatar" src="${member.avatar || 'assets/icons/default-avatar.svg'}" alt="${member.nickname}">
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

            // 检查好友成就
            await this.checkFriendAchievements();
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
        // 简化版本：只显示好友货物数量
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

            // 选择第一个可截胡的货物
            const targetCargo = result.data.find(c => Date.now() - c.startTime >= c.growTime && !c.isProtected);
            if (targetCargo) {
                const stealResult = await stationApi.stealCargo(friendId, targetCargo.id);
                if (stealResult.success) {
                    Utils.showToast(stealResult.data.message, 'success');
                    this.currentUser = Storage.getUserInfo();
                    this.updateUserInfo();

                    // 检查成就进度
                    await this.checkAchievementProgress('first_steal');

                    // 更新任务进度
                    await this.updateTaskProgress('daily', 'daily_steal_3', 1);
                    await this.updateTaskProgress('weekly', 'weekly_steal_20', 1);

                    // 检查截胡成就
                    await this.checkStealAchievements();

                    // 检查财富成就
                    await this.checkWealthAchievements();
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

            // 更新任务进度
            await this.updateTaskProgress('daily', 'daily_chat_5', 1);

            // 检查是否有可领取的成就（chatApi 已经更新了成就进度）
            const claimableResult = await achievementApi.getClaimableAchievements(this.currentUser.userId);
            if (claimableResult.data.length > 0) {
                this.showAchievementNotification(claimableResult.data[0]);
            }
        } else {
            Utils.showToast(result.message || '发送失败', 'error');
        }
    },

    // 启动聊天定时器
    startChatTimer() {
        this.stopChatTimer();
        this.timers.chat = setInterval(() => {
            if (document.getElementById('chat-page').classList.contains('active')) {
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

        // 更新货币显示
        document.getElementById('shop-coins').textContent = this.currentUser.coins;
        document.getElementById('shop-diamonds').textContent = this.currentUser.diamonds;

        const activeTab = document.querySelector('.shop-tab.active');
        const category = activeTab ? activeTab.dataset.category : 'props';

        const result = await shopApi.getShopItems(category);
        if (!result.success) return;

        const list = document.getElementById('shop-list');
        list.innerHTML = '';

        result.data.forEach(item => {
            const ownItem = this.currentUser.items.find(i => i.id === item.id);
            const ownCount = ownItem ? ownItem.count : 0;

            const itemDiv = document.createElement('div');
            const iconPath = `assets/icons/${item.id}.svg`;
            itemDiv.className = 'shop-item card';
            itemDiv.innerHTML = `
                <div class="item-icon">
                    <img src="${iconPath}" alt="${item.name}" onerror="this.src='assets/icons/default-avatar.svg'">
                </div>
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

        document.getElementById('buy-item-name').textContent = `购买 ${item.name}`;
        document.getElementById('buy-item-desc').textContent = item.desc;
        document.getElementById('buy-currency-icon').src = `assets/icons/${item.currency}.svg`;
        document.getElementById('qty-input').value = 1;
        document.getElementById('buy-item-icon').src = `assets/icons/${item.id}.svg`;

        this.updateBuyTotal();
        Utils.showModal('buy-modal');
    },

    // 更新购买总价
    updateBuyTotal() {
        if (!this.selectedShopItem) return;

        const qty = parseInt(document.getElementById('qty-input').value) || 1;
        const total = this.selectedShopItem.price * qty;
        document.getElementById('total-price-value').textContent = total;
    },

    // 确认购买
    async confirmBuy() {
        if (!this.currentUser || !this.selectedShopItem) return;

        const qty = parseInt(document.getElementById('qty-input').value) || 1;

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

        document.getElementById('profile-nickname').textContent = this.currentUser.nickname;
        document.getElementById('profile-branch').textContent = this.currentUser.branchName;
        document.getElementById('profile-level').textContent = this.currentUser.level;
        document.getElementById('profile-coins').textContent = this.currentUser.coins;
        document.getElementById('profile-diamonds').textContent = this.currentUser.diamonds;

        // 道具列表
        const itemsGrid = document.getElementById('items-grid');
        itemsGrid.innerHTML = '';

        if (this.currentUser.items.length === 0) {
            itemsGrid.innerHTML = '<div class="empty-state"><div>📦</div><p>暂无道具</p></div>';
        } else {
            this.currentUser.items.forEach(item => {
                const itemDiv = document.createElement('div');
                const iconPath = `assets/icons/${item.id}.svg`;
                itemDiv.className = 'item-cell';
                itemDiv.innerHTML = `
                <img src="${iconPath}" alt="${item.name}" onerror="this.src='assets/icons/default-avatar.svg'">
                <div class="name">${item.name}</div>
                <div class="count">${item.count}</div>
            `;
                itemDiv.onclick = () => this.handleItemUse(item);
                itemsGrid.appendChild(itemDiv);
            });
        }
    },

    // 处理道具使用
    handleItemUse(item) {
        if (item.id === 'rename_card') {
            this.handleRename(item);
        } else if (item.id === 'transfer_card') {
            this.handleTransfer(item);
        } else {
            // 其他道具的使用逻辑（如加速卡等通常在特定场景使用，这里可以提示）
            Utils.showToast('请在对应场景使用该道具', 'info');
        }
    },

    // 使用改名卡
    handleRename(item) {
        const newName = prompt('请输入新的昵称（2-12个字符）：', this.currentUser.nickname);
        if (newName) {
            const trimmedName = newName.trim();
            if (trimmedName.length < 2 || trimmedName.length > 12) {
                Utils.showToast('昵称长度2-12个字符', 'error');
                return;
            }

            if (trimmedName === this.currentUser.nickname) {
                return;
            }

            // 消耗道具
            this.consumeItem(item.id, 1);

            // 更新昵称
            this.currentUser.nickname = trimmedName;
            Storage.setUserInfo(this.currentUser);
            this.updateUserInfo();
            this.loadProfile(); // 刷新背包显示
            Utils.showToast('改名成功！', 'success');
        }
    },

    // 使用转区卡
    handleTransfer(item) {
        if (confirm('确定要使用转区卡更换分拨中心吗？')) {
            // 复用注册页面的分拨选择逻辑
            // 保存当前状态标记，以便 handleRegister 知道是转区而不是注册
            this.isTransferring = true;
            this.showBranchSelection();

            // 修改确认按钮文字
            const confirmBtn = document.getElementById('confirm-branch-btn');
            if (confirmBtn) {
                confirmBtn.textContent = '确认转区';
            }
        }
    },

    // 消耗道具
    consumeItem(itemId, count) {
        const itemIndex = this.currentUser.items.findIndex(i => i.id === itemId);
        if (itemIndex > -1) {
            this.currentUser.items[itemIndex].count -= count;
            if (this.currentUser.items[itemIndex].count <= 0) {
                this.currentUser.items.splice(itemIndex, 1);
            }
            Storage.setUserInfo(this.currentUser);
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
            Utils.switchPage('login-page');
            Utils.showToast('已退出登录');
        }
    },

    // ==================== 成就系统相关方法 ====================

    // 加载成就页面
    async loadAchievements() {
        if (!this.currentUser) return;

        const result = await achievementApi.getUserAchievements(this.currentUser.userId);
        if (!result.success) return;

        const userAchievements = result.data[this.currentUser.userId] || { claimed: [], progress: {} };

        // 获取可领取的成就
        const claimableResult = await achievementApi.getClaimableAchievements(this.currentUser.userId);
        const claimableList = claimableResult.data;

        // 获取未完成的成就
        const unclaimedResult = await achievementApi.getUnclaimedAchievements(this.currentUser.userId);
        const unclaimedList = unclaimedResult.data;

        // 渲染成就列表
        this.renderAchievementList(claimableList, unclaimedList, userAchievements);
    },

    // 渲染成就列表
    renderAchievementList(claimableList, unclaimedList, userAchievements) {
        const container = document.getElementById('achievement-list');
        if (!container) return;

        container.innerHTML = '';

        // 渲染可领取的成就
        if (claimableList.length > 0) {
            const claimableSection = document.createElement('div');
            claimableSection.className = 'achievement-section';
            claimableSection.innerHTML = '<h3>🎯 可领取成就</h3>';
            container.appendChild(claimableSection);

            claimableList.forEach(ach => {
                const item = this.createAchievementItem(ach, 'claimable');
                container.appendChild(item);
            });
        }

        // 渲染未完成的成就
        if (unclaimedList.length > 0) {
            const unclaimedSection = document.createElement('div');
            unclaimedSection.className = 'achievement-section';
            unclaimedSection.innerHTML = '<h3>📋 未完成成就</h3>';
            container.appendChild(unclaimedSection);

            unclaimedList.forEach(ach => {
                const item = this.createAchievementItem(ach, 'unclaimed');
                container.appendChild(item);
            });
        }

        // 渲染已领取的成就（显示进度）
        const claimedSection = document.createElement('div');
        claimedSection.className = 'achievement-section';
        claimedSection.innerHTML = '<h3>🏆 已完成成就</h3>';
        container.appendChild(claimedSection);

        userAchievements.claimed.forEach(achId => {
            const allAchievements = [
                ...CONFIG.achievements.beginner,
                ...CONFIG.achievements.growth,
                ...CONFIG.achievements.social,
                ...CONFIG.achievements.wealth
            ];
            const ach = allAchievements.find(a => a.id === achId);
            if (ach) {
                const item = this.createAchievementItem(ach, 'claimed');
                container.appendChild(item);
            }
        });
    },

    // 创建成就项DOM
    createAchievementItem(ach, type) {
        const item = document.createElement('div');
        item.className = 'achievement-item';

        let statusHtml = '';
        let buttonHtml = '';

        if (type === 'claimable') {
            statusHtml = '<span class="status claimable">可领取</span>';
            buttonHtml = '<button class="claim-btn" data-id="' + ach.id + '">领取</button>';
        } else if (type === 'unclaimed') {
            statusHtml = '<span class="status unclaimed">未完成</span>';
            buttonHtml = '<button class="disabled-btn" disabled>未完成</button>';
        } else {
            statusHtml = '<span class="status completed">已完成</span>';
            buttonHtml = '<button class="disabled-btn" disabled>已领取</button>';
        }

        item.innerHTML = `
            <div class="achievement-info">
                <div class="achievement-name">${ach.name}</div>
                <div class="achievement-desc">${ach.desc}</div>
                <div class="achievement-type">类型: ${ach.type}</div>
                <div class="achievement-reward">奖励: 💎${ach.reward.diamonds || 0} 💰${ach.reward.coins || 0}</div>
            </div>
            <div class="achievement-status">
                ${statusHtml}
                ${buttonHtml}
            </div>
        `;

        // 绑定领取事件
        if (type === 'claimable') {
            const btn = item.querySelector('.claim-btn');
            btn.addEventListener('click', () => this.claimAchievement(ach.id));
        }

        return item;
    },

    // 领取成就奖励
    async claimAchievement(achievementId) {
        const result = await achievementApi.checkAndClaimAchievement(this.currentUser.userId, achievementId);

        if (result.success) {
            Utils.showToast(`成就达成！获得 ${result.data.reward.diamonds || 0} 钻石`, 'success');
            this.currentUser = Storage.getUserInfo();
            this.updateUserInfo();
            this.loadAchievements();
        } else {
            Utils.showToast(result.message || '领取失败', 'error');
        }
    },

    // 检查并触发成就进度（在关键操作后调用）
    async checkAchievementProgress(triggerKey) {
        if (!this.currentUser) return;

        // 更新成就进度
        await achievementApi.updateAchievementProgress(this.currentUser.userId, triggerKey);

        // 检查是否有可领取的成就
        const claimableResult = await achievementApi.getClaimableAchievements(this.currentUser.userId);
        if (claimableResult.data.length > 0) {
            // 显示提示
            this.showAchievementNotification(claimableResult.data[0]);
        }
    },

    // 显示成就通知
    showAchievementNotification(achievement) {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = `🎉 成就解锁: ${achievement.name}！快去领取奖励`;
            toast.className = 'toast show success';
            setTimeout(() => {
                toast.className = 'toast';
            }, 3000);
        }
    },

    // ==================== 签到系统相关方法 ====================

    // 加载签到页面
    async loadCheckIn() {
        if (!this.currentUser) return;

        // 检查今天是否可以签到
        const canCheckResult = await checkInApi.canCheckIn(this.currentUser.userId);
        const canCheckIn = canCheckResult.data.canCheckIn;

        // 获取签到奖励预览
        const rewardsResult = await checkInApi.getCheckInRewards();
        const rewards = rewardsResult.data;

        // 获取用户签到数据
        const userCheckResult = await checkInApi.getUserCheckIn(this.currentUser.userId);
        const userCheckIn = userCheckResult.data;

        // 渲染签到页面
        this.renderCheckInPage(canCheckIn, rewards, userCheckIn);
    },

    // 渲染签到页面
    renderCheckInPage(canCheckIn, rewards, userCheckIn) {
        const container = document.getElementById('check-in-container');
        if (!container) return;

        const consecutiveDays = userCheckIn ? userCheckIn.consecutiveDays : 0;
        const totalCheckIns = userCheckIn ? userCheckIn.totalCheckIns : 0;

        // 显示最近7天的奖励，但支持滚动查看更多
        const displayDays = 7;
        const startIndex = Math.max(0, consecutiveDays - 3);
        const displayRewards = rewards.slice(startIndex, startIndex + displayDays);

        let html = `
            <div class="check-in-header">
                <h3>📅 每日签到</h3>
                <p>连续签到可获得丰厚奖励！坚持越久，奖励越多！</p>
                <div class="consecutive-info">
                    连续签到: <strong>${consecutiveDays} 天</strong> | 累计签到: <strong>${totalCheckIns} 天</strong>
                </div>
            </div>
            <div class="check-in-rewards">
        `;

        // 显示当前奖励预览
        displayRewards.forEach((reward, index) => {
            const day = startIndex + index + 1;
            const isCurrentDay = day === consecutiveDays + 1;
            const isPastDay = day <= consecutiveDays;
            const isNextDay = day === consecutiveDays + 1;

            let statusClass = 'reward-item';
            if (isCurrentDay) statusClass += ' current';
            if (isPastDay) statusClass += ' past';
            if (!isPastDay && !isCurrentDay) statusClass += ' future';

            // 检查是否有额外奖励
            const hasBonus = CONFIG.consecutiveBonus[day] ? ' ⭐' : '';

            html += `
                <div class="${statusClass}">
                    <div class="reward-day">第 ${day} 天${hasBonus}</div>
                    <div class="reward-content">
                        <span>💎 ${reward.diamonds}</span>
                        <span>💰 ${reward.coins}</span>
                    </div>
                    ${isCurrentDay ? '<div class="current-badge">今日</div>' : ''}
                    ${isPastDay ? '<div class="past-badge">✓</div>' : ''}
                </div>
            `;
        });

        // 显示额外奖励提示
        const nextBonusDay = Object.keys(CONFIG.consecutiveBonus).find(d => parseInt(d) > consecutiveDays);
        if (nextBonusDay) {
            const bonus = CONFIG.consecutiveBonus[nextBonusDay];
            html += `
                <div class="bonus-info-card">
                    <div class="bonus-title">🎯 ${nextBonusDay}天里程碑奖励</div>
                    <div class="bonus-content">
                        💎 ${bonus.diamonds} + 💰 ${bonus.coins} + ${bonus.itemCount}个道具
                    </div>
                </div>
            `;
        }

        html += '</div>';

        // 签到按钮和预览
        if (canCheckIn) {
            const nextDay = consecutiveDays + 1;
            const nextReward = rewards[Math.min(nextDay - 1, rewards.length - 1)];

            // 检查明天是否会获得里程碑奖励
            let milestoneHtml = '';
            const tomorrowBonusDay = Object.keys(CONFIG.consecutiveBonus).find(d => parseInt(d) === nextDay);
            if (tomorrowBonusDay) {
                const bonus = CONFIG.consecutiveBonus[tomorrowBonusDay];
                milestoneHtml = `
                    <div class="milestone-preview">
                        <div class="milestone-badge">🎯 明日里程碑</div>
                        <div class="milestone-content">
                            💎 ${bonus.diamonds} + 💰 ${bonus.coins} + ${bonus.itemCount}个${bonus.item === 'protection_shield' ? '防护盾' : bonus.item === 'speed_up' ? '加速卡' : '广播喇叭'}
                        </div>
                    </div>
                `;
            }

            html += `
                <div class="check-in-preview">
                    <div class="preview-main">
                        <span>明日签到获得: 💎${nextReward.diamonds} 💰${nextReward.coins}</span>
                    </div>
                    ${milestoneHtml}
                </div>
                <button class="check-in-btn" id="do-check-in">立即签到</button>
            `;
        } else {
            html += '<button class="disabled-btn" disabled>今日已签到</button>';
        }

        container.innerHTML = html;

        // 绑定签到事件
        if (canCheckIn) {
            const btn = document.getElementById('do-check-in');
            if (btn) {
                btn.addEventListener('click', () => this.doCheckIn());
            }
        }
    },

    // 执行签到
    async doCheckIn() {
        const result = await checkInApi.checkIn(this.currentUser.userId);

        if (result.success) {
            const reward = result.data.reward;
            const bonus = result.data.bonus;
            const consecutiveDays = result.data.consecutiveDays;

            // 构建签到成功消息
            let message = `📅 签到成功！第${consecutiveDays}天\n💎 ${reward.diamonds} 💰 ${reward.coins}`;

            // 如果有额外奖励，添加到消息中
            if (bonus) {
                message += `\n🎯 里程碑奖励！\n💎 ${bonus.diamonds} 💰 ${bonus.coins} + ${bonus.itemCount}个道具`;
            }

            Utils.showToast(message, 'success');
            this.currentUser = Storage.getUserInfo();
            this.updateUserInfo();
            this.loadCheckIn();
        } else {
            Utils.showToast(result.message || '签到失败', 'error');
        }
    },

    // ==================== 任务系统相关方法 ====================

    // 加载任务页面
    async loadTasks() {
        if (!this.currentUser) return;

        const result = await taskApi.getAllTasks(this.currentUser.userId);
        if (!result.success) return;

        const tasks = result.data;

        // 获取可领取的任务
        const claimableResult = await taskApi.getClaimableTasks(this.currentUser.userId);
        const claimableTasks = claimableResult.data;

        // 渲染任务列表
        this.renderTaskList(tasks, claimableTasks);
    },

    // 渲染任务列表
    renderTaskList(tasks, claimableTasks) {
        const container = document.getElementById('task-list');
        if (!container) return;

        container.innerHTML = '';

        // 渲染可领取的任务
        const totalClaimable = claimableTasks.daily.length + claimableTasks.weekly.length + claimableTasks.challenge.length;
        if (totalClaimable > 0) {
            const claimableSection = document.createElement('div');
            claimableSection.className = 'task-section';
            claimableSection.innerHTML = '<h3>🎁 可领取奖励</h3>';
            container.appendChild(claimableSection);

            ['daily', 'weekly', 'challenge'].forEach(type => {
                claimableTasks[type].forEach(task => {
                    const item = this.createTaskItem(task, type, 'claimable');
                    container.appendChild(item);
                });
            });
        }

        // 渲染每日任务
        if (tasks.daily.length > 0) {
            const dailySection = document.createElement('div');
            dailySection.className = 'task-section';
            dailySection.innerHTML = '<h3>🌞 每日任务</h3>';
            container.appendChild(dailySection);

            tasks.daily.forEach(task => {
                const type = task.completed ? 'completed' : 'active';
                const item = this.createTaskItem(task, 'daily', type);
                container.appendChild(item);
            });
        }

        // 渲染每周任务
        if (tasks.weekly.length > 0) {
            const weeklySection = document.createElement('div');
            weeklySection.className = 'task-section';
            weeklySection.innerHTML = '<h3>📅 每周任务</h3>';
            container.appendChild(weeklySection);

            tasks.weekly.forEach(task => {
                const type = task.completed ? 'completed' : 'active';
                const item = this.createTaskItem(task, 'weekly', type);
                container.appendChild(item);
            });
        }

        // 渲染挑战任务
        if (tasks.challenge.length > 0) {
            const challengeSection = document.createElement('div');
            challengeSection.className = 'task-section';
            challengeSection.innerHTML = '<h3>🏆 挑战任务</h3>';
            container.appendChild(challengeSection);

            tasks.challenge.forEach(task => {
                const type = task.completed ? 'completed' : 'active';
                const item = this.createTaskItem(task, 'challenge', type);
                container.appendChild(item);
            });
        }
    },

    // 创建任务项DOM
    createTaskItem(task, taskType, type) {
        const item = document.createElement('div');
        item.className = 'task-item';

        let buttonHtml = '';
        let statusHtml = '';

        if (type === 'claimable') {
            statusHtml = `<div class="task-progress">进度: ${task.progress}/${task.target}</div>`;
            buttonHtml = '<button class="claim-btn" data-type="' + taskType + '" data-id="' + task.id + '">领取奖励</button>';
        } else if (type === 'completed') {
            statusHtml = `<div class="task-progress completed">已完成: ${task.progress}/${task.target}</div>`;
            buttonHtml = '<button class="disabled-btn" disabled>已领取</button>';
        } else {
            statusHtml = `<div class="task-progress">进度: ${task.progress}/${task.target}</div>`;
            buttonHtml = '<button class="disabled-btn" disabled>进行中</button>';
        }

        item.innerHTML = `
            <div class="task-info">
                <div class="task-name">${task.name}</div>
                <div class="task-desc">${task.desc}</div>
                ${statusHtml}
                <div class="task-reward">奖励: 💎${task.reward.diamonds || 0} 💰${task.reward.coins || 0}</div>
            </div>
            <div class="task-action">
                ${buttonHtml}
            </div>
        `;

        // 绑定领取事件
        if (type === 'claimable') {
            const btn = item.querySelector('.claim-btn');
            btn.addEventListener('click', () => this.claimTask(taskType, task.id));
        }

        return item;
    },

    // 领取任务奖励
    async claimTask(taskType, taskId) {
        const result = await taskApi.claimTaskReward(this.currentUser.userId, taskType, taskId);

        if (result.success) {
            const reward = result.data.reward;
            Utils.showToast(`任务完成！获得 💎${reward.diamonds || 0} 💰${reward.coins || 0}`, 'success');
            this.currentUser = Storage.getUserInfo();
            this.updateUserInfo();
            this.loadTasks();
        } else {
            Utils.showToast(result.message || '领取失败', 'error');
        }
    },

    // 更新任务进度（在关键操作后调用）
    async updateTaskProgress(taskType, taskId, increment = 1) {
        if (!this.currentUser) return;
        await taskApi.updateTaskProgress(this.currentUser.userId, taskType, taskId, increment);
    },

    // ==================== 统一入口方法 ====================

    // 打开成就页面
    openAchievementPage() {
        this.switchToPage('achievement');
    },

    // 打开签到页面
    openCheckInPage() {
        this.switchToPage('checkin');
    },

    // 打开任务页面
    openTaskPage() {
        this.switchToPage('task');
    },

    // ==================== 成就检查辅助方法 ====================

    // 检查财富成就
    async checkWealthAchievements() {
        if (!this.currentUser) return;

        const userInfo = Storage.getUserInfo();
        const totalEarned = userInfo.coins;

        if (totalEarned >= 10000) {
            await achievementApi.updateAchievementProgress(this.currentUser.userId, 'earn_10000');
        }
        if (totalEarned >= 50000) {
            await achievementApi.updateAchievementProgress(this.currentUser.userId, 'earn_50000');
        }
        if (totalEarned >= 100000) {
            await achievementApi.updateAchievementProgress(this.currentUser.userId, 'earn_100000');
        }

        // 检查是否有可领取的成就
        const claimableResult = await achievementApi.getClaimableAchievements(this.currentUser.userId);
        if (claimableResult.data.length > 0) {
            this.showAchievementNotification(claimableResult.data[0]);
        }
    },

    // 检查截胡成就
    async checkStealAchievements() {
        if (!this.currentUser) return;

        const userInfo = Storage.getUserInfo();
        const stealCount = userInfo.stealCount || 0;

        if (stealCount >= 10) {
            await achievementApi.updateAchievementProgress(this.currentUser.userId, 'steal_10');
        }
        if (stealCount >= 50) {
            await achievementApi.updateAchievementProgress(this.currentUser.userId, 'steal_50');
        }
        if (stealCount >= 100) {
            await achievementApi.updateAchievementProgress(this.currentUser.userId, 'steal_100');
        }

        // 检查是否有可领取的成就
        const claimableResult = await achievementApi.getClaimableAchievements(this.currentUser.userId);
        if (claimableResult.data.length > 0) {
            this.showAchievementNotification(claimableResult.data[0]);
        }
    },

    // 检查好友成就
    async checkFriendAchievements() {
        if (!this.currentUser) return;

        const friends = Storage.getFriendList(this.currentUser.userId);

        if (friends.length >= 5) {
            await achievementApi.updateAchievementProgress(this.currentUser.userId, 'friend_5');

            // 检查是否有可领取的成就
            const claimableResult = await achievementApi.getClaimableAchievements(this.currentUser.userId);
            if (claimableResult.data.length > 0) {
                this.showAchievementNotification(claimableResult.data[0]);
            }
        }
    },

    // 检查等级成就
    async checkLevelAchievements() {
        if (!this.currentUser) return;

        const userInfo = Storage.getUserInfo();

        if (userInfo.level >= 5) {
            await achievementApi.updateAchievementProgress(this.currentUser.userId, 'level_5');
        }
        if (userInfo.level >= 10) {
            await achievementApi.updateAchievementProgress(this.currentUser.userId, 'level_10');
        }
        if (userInfo.level >= 20) {
            await achievementApi.updateAchievementProgress(this.currentUser.userId, 'level_20');
        }

        // 检查是否有可领取的成就
        const claimableResult = await achievementApi.getClaimableAchievements(this.currentUser.userId);
        if (claimableResult.data.length > 0) {
            this.showAchievementNotification(claimableResult.data[0]);
        }
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

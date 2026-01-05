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
        // 初始化视觉增强系统
        setTimeout(() => {
            Utils.initVisualEnhancements();
        }, 500);
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

        // 注册按钮
        const registerBtn = document.getElementById('register-btn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => this.handleRegisterClick());
        }

        // 注册页面确认分拨
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
                this.handleChatTabSwitch();
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

        // 绑定亲密度系统事件
        this.bindIntimacyEvents();
    },

    // 检查登录状态
    checkLogin() {
        setTimeout(async () => {
            const token = localStorage.getItem('authToken');
            const userInfo = Storage.getUserInfo();

            if (token && userInfo) {
                // 验证 token 有效性
                const result = await userApi.getUserInfo();

                if (result.success) {
                    this.currentUser = result.data;
                    Storage.setUserInfo(result.data);

                    // 连接 WebSocket
                    if (typeof wsClient !== 'undefined') {
                        wsClient.connect();
                    }

                    Utils.switchPage('main-page');
                    this.initMainPage();
                } else {
                    // Token 无效，清除登录状态
                    localStorage.removeItem('authToken');
                    Storage.removeUserInfo();
                    Utils.switchPage('login-page');
                }
            } else {
                Utils.switchPage('login-page');
            }
        }, 1500);
    },

    // 处理登录
    async handleLogin() {
        const nickname = document.getElementById('nickname-input').value.trim();
        const password = document.getElementById('password-input').value;

        if (!nickname) {
            Utils.showToast('请输入昵称', 'error');
            return;
        }

        if (!password) {
            Utils.showToast('请输入密码', 'error');
            return;
        }

        if (password.length < 6) {
            Utils.showToast('密码至少6位', 'error');
            return;
        }

        const result = await userApi.login({ nickname, password });

        if (result.success) {
            this.currentUser = result.data.userInfo;
            Utils.showToast('登录成功！', 'success');

            // 连接 WebSocket
            if (typeof wsClient !== 'undefined') {
                wsClient.connect();
            }

            setTimeout(() => {
                Utils.switchPage('main-page');
                this.initMainPage();
            }, 500);
        } else {
            Utils.showToast(result.message || '登录失败', 'error');
        }
    },

    // 处理注册按钮点击
    handleRegisterClick() {
        const nickname = document.getElementById('nickname-input').value.trim();
        const password = document.getElementById('password-input').value;

        if (!nickname) {
            Utils.showToast('请输入昵称', 'error');
            return;
        }

        if (nickname.length < 2 || nickname.length > 20) {
            Utils.showToast('昵称长度2-20个字符', 'error');
            return;
        }

        if (!password) {
            Utils.showToast('请输入密码', 'error');
            return;
        }

        if (password.length < 6) {
            Utils.showToast('密码至少6位', 'error');
            return;
        }

        // 保存临时数据
        this.tempNickname = nickname;
        this.tempPassword = password;
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
            password: this.tempPassword,
            branchId: this.selectedBranch
        });

        if (result.success) {
            this.currentUser = result.data.userInfo;
            Utils.showToast('注册成功！获得新手礼包', 'success');

            // 连接 WebSocket
            if (typeof wsClient !== 'undefined') {
                wsClient.connect();
            }

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
        this.initEnhancedChat();
    },

    // 检查并显示奖励通知
    async checkRewardsNotification() {
        if (!this.currentUser) return;

        // 检查可领取的成就
        const claimableAchievements = await achievementApi.getClaimableAchievements(this.currentUser.userId);
        if (claimableAchievements.data.length > 0) {
            Utils.showToast(`有 ${claimableAchievements.data.length} 个成就可领取！`);
            return;
        }

        // 检查签到
        const canCheckIn = await checkInApi.canCheckIn(this.currentUser.userId);
        if (canCheckIn.data.canCheckIn) {
            Utils.showToast('今日还未签到，快去领取奖励！');
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

        const result = await stationApi.getStationCargos();
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
                <div>${cargo.value}金币</div>
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

        // 获取货位元素用于动画
        const slotElement = document.querySelector(`.cargo-slot[data-cargo-id="${this.selectedCargo.id}"]`) ||
                           document.querySelectorAll('.cargo-slot')[this.selectedSlotIndex];

        const result = await stationApi.harvestCargo(this.currentUser.userId, this.selectedCargo.id);
        if (result.success) {
            // 播放收取庆祝动画
            if (slotElement) {
                Utils.celebrate.harvest(slotElement, result.data.exp, result.data.coins);
            }

            // 延迟显示Toast，让动画先播放
            setTimeout(() => {
                Utils.showToast(`获得 ${result.data.coins} 金币！`, 'success');
            }, 300);

            await userApi.addExp(this.currentUser.userId, result.data.exp);

            // 检查是否升级
            const oldLevel = this.currentUser.level;
            this.currentUser = Storage.getUserInfo();
            const newLevel = this.currentUser.level;

            // 如果升级了，播放升级特效
            if (newLevel > oldLevel) {
                const levelElement = document.querySelector('.level');
                if (levelElement) {
                    setTimeout(() => {
                        Utils.celebrate.levelUp(levelElement, newLevel);
                    }, 800);
                }
            }

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

        const result = await stationApi.getStationCargos();
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

        // 获取所有就绪货位的DOM元素
        const allSlots = document.querySelectorAll('.cargo-slot');

        for (let i = 0; i < readyCargos.length; i++) {
            const cargo = readyCargos[i];
            const harvestResult = await stationApi.harvestCargo(this.currentUser.userId, cargo.id);
            if (harvestResult.success) {
                totalCoins += harvestResult.data.coins;
                totalExp += harvestResult.data.exp;
                harvestCount++;

                // 为每个收取的货位播放动画（错开时间）
                const slotElement = document.querySelector(`.cargo-slot[data-cargo-id="${cargo.id}"]`) ||
                                   allSlots[cargo.slotIndex];
                if (slotElement) {
                    setTimeout(() => {
                        Utils.particles.createGoldParticles(
                            slotElement.getBoundingClientRect().left + slotElement.offsetWidth / 2,
                            slotElement.getBoundingClientRect().top + slotElement.offsetHeight / 2,
                            6
                        );
                    }, i * 150);
                }
            }
        }

        if (totalExp > 0) {
            await userApi.addExp(this.currentUser.userId, totalExp);
        }

        // 播放大量彩色纸屑庆祝
        setTimeout(() => {
            Utils.particles.createConfetti(window.innerWidth / 2, 100, 30);
        }, readyCargos.length * 150);

        // 检查是否升级
        const oldLevel = this.currentUser.level;
        this.currentUser = Storage.getUserInfo();
        const newLevel = this.currentUser.level;

        // 如果升级了，播放升级特效
        if (newLevel > oldLevel) {
            const levelElement = document.querySelector('.level');
            if (levelElement) {
                setTimeout(() => {
                    Utils.celebrate.levelUp(levelElement, newLevel);
                }, 500);
            }
        }

        Utils.showToast(`收取完成！获得 ${totalCoins} 金币`, 'success');
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
            // 获取好友列表
            const result = await friendApi.getFriendList(this.currentUser.userId);
            if (result.success && result.data.length > 0) {
                // 获取亲密度列表
                const intimacyResult = await intimacyApi.getIntimacyList();
                const intimacyMap = {};
                if (intimacyResult.success && intimacyResult.data) {
                    intimacyResult.data.forEach(item => {
                        intimacyMap[item.friendId] = item.intimacyValue;
                    });
                }

                // 为好友数据添加亲密度信息
                result.data.forEach(friend => {
                    friend.intimacy = intimacyMap[friend.userId] || 0;
                    const item = this.createFriendItem(friend, true);
                    list.appendChild(item);
                });
            } else {
                list.innerHTML = '<div class="empty-state"><div>👥</div><p>暂无好友</p></div>';
            }
        } else if (tabType === 'branch') {
            // 分拨成员
            const result = await friendApi.getBranchMembers(this.currentUser.branchId);
            if (result.success && result.data.list.length > 0) {
                result.data.list.forEach(member => {
                    if (member.userId !== this.currentUser.userId) {
                        const item = this.createFriendItem(member, false);
                        list.appendChild(item);
                    }
                });
            } else {
                list.innerHTML = '<div class="empty-state"><div>👥</div><p>暂无分拨成员</p></div>';
            }
        } else if (tabType === 'gifts') {
            // 收礼记录
            await this.loadGiftRecords(list);
        }
    },

    // 加载收礼记录
    async loadGiftRecords(container) {
        const result = await intimacyApi.getReceivedGifts(50);
        if (result.success && result.data && result.data.length > 0) {
            result.data.forEach(record => {
                const item = this.createGiftRecordItem(record);
                container.appendChild(item);
            });
        } else {
            container.innerHTML = '<div class="empty-state"><div>🎁</div><p>暂无收礼记录</p></div>';
        }
    },

    // 创建收礼记录项
    createGiftRecordItem(record) {
        const item = document.createElement('div');
        item.className = 'gift-record-item';

        const timeStr = Utils.formatTime ? Utils.formatTime(record.createdAt) : new Date(record.createdAt).toLocaleString();

        item.innerHTML = `
            <img class="sender-avatar" src="${record.senderAvatar || 'assets/icons/default-avatar.svg'}" alt="">
            <div class="gift-record-content">
                <div class="gift-record-header">
                    <span class="gift-record-sender">${record.senderNickname}</span>
                    <span class="gift-record-time">${timeStr}</span>
                </div>
                <div class="gift-record-info">
                    <span class="gift-emoji">${record.giftIcon}</span>
                    <span>送了 ${record.giftName}</span>
                    <span class="intimacy-gain">+${record.intimacyGain}</span>
                </div>
                ${record.message ? `<div class="gift-record-message">"${record.message}"</div>` : ''}
            </div>
        `;

        return item;
    },

    createFriendItem(member, showIntimacy = true) {
        const item = document.createElement('div');
        item.className = 'friend-item';

        // 构建亲密度徽章 HTML（如果有亲密度数据）
        let intimacyBadgeHtml = '';
        if (showIntimacy && member.intimacy !== undefined) {
            const levelInfo = this.getIntimacyLevelInfo(member.intimacy);
            intimacyBadgeHtml = `
                <div class="intimacy-badge">
                    <span class="intimacy-icon-small">${levelInfo.icon}</span>
                    <span class="intimacy-text">${levelInfo.name}</span>
                </div>
            `;
        }

        item.innerHTML = `
            <img class="avatar" src="${member.avatar || 'assets/icons/default-avatar.svg'}" alt="${member.nickname}">
            <div class="friend-info">
                <div class="name">${member.nickname}</div>
                <div class="branch">Lv.${member.level}</div>
                ${intimacyBadgeHtml}
            </div>
            <div class="friend-actions-btns">
                <button class="visit-btn">拜访</button>
                ${showIntimacy ? '<button class="detail-btn">详情</button>' : ''}
            </div>
        `;

        // 绑定拜访按钮事件
        item.querySelector('.visit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.visitFriendStation(member.userId);
        });

        // 绑定详情按钮事件（亲密度详情）
        const detailBtn = item.querySelector('.detail-btn');
        if (detailBtn) {
            detailBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openFriendDetail(member);
            });
        }

        // 点击整个好友项也可以查看详情
        if (showIntimacy) {
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
                this.openFriendDetail(member);
            });
        }

        return item;
    },

    // 获取亲密度等级信息
    getIntimacyLevelInfo(intimacyValue) {
        const levels = [
            { min: 0, max: 99, name: '点头之交', icon: '👋' },
            { min: 100, max: 299, name: '普通朋友', icon: '🤝' },
            { min: 300, max: 599, name: '好朋友', icon: '😊' },
            { min: 600, max: 999, name: '亲密好友', icon: '💕' },
            { min: 1000, max: 1499, name: '挚友', icon: '❤️' },
            { min: 1500, max: 2099, name: '闺蜜/兄弟', icon: '💖' },
            { min: 2100, max: 2799, name: '知己', icon: '💝' },
            { min: 2800, max: 3599, name: '灵魂伴侣', icon: '💗' },
            { min: 3600, max: 4499, name: '命中注定', icon: '💞' },
            { min: 4500, max: 999999, name: '生死之交', icon: '💎' }
        ];

        for (const level of levels) {
            if (intimacyValue >= level.min && intimacyValue <= level.max) {
                return level;
            }
        }
        return levels[0];
    },

    // 添加好友
    async addFriend() {
        const keyword = prompt('请输入要搜索的用户昵称（至少2个字符）：');
        if (!keyword || keyword.length < 2) {
            Utils.showToast('请输入至少2个字符的昵称', 'error');
            return;
        }

        // 搜索用户
        const searchResult = await friendApi.searchUsers(keyword);
        if (!searchResult.success || searchResult.data.length === 0) {
            Utils.showToast('未找到匹配的用户', 'error');
            return;
        }

        // 显示搜索结果让用户选择
        const users = searchResult.data;
        let message = '找到以下用户，请输入编号选择：\n\n';
        users.forEach((user, index) => {
            message += `${index + 1}. ${user.nickname} (ID: ${user.userId}) - ${user.branchName}\n`;
        });
        message += '\n输入编号（如 1, 2, 3）：';

        const choice = prompt(message);
        if (!choice) return;

        const index = parseInt(choice) - 1;
        if (index < 0 || index >= users.length) {
            Utils.showToast('无效的选择', 'error');
            return;
        }

        const targetUser = users[index];
        const result = await friendApi.addFriend(this.currentUser.userId, targetUser.userId);
        
        if (result.success) {
            Utils.showToast(`成功添加好友：${targetUser.nickname}`, 'success');
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
        // 获取好友站场货物
        const result = await stationApi.getFriendCargos(friendId);
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

    // 处理聊天标签切换
    handleChatTabSwitch() {
        const groupView = document.getElementById('group-chat-view');
        const conversationListView = document.getElementById('conversation-list-view');
        const privateChatView = document.getElementById('private-chat-view');

        if (this.chatType === 'private') {
            // 显示私聊视图
            if (groupView) groupView.classList.add('hidden');
            if (conversationListView) conversationListView.classList.remove('hidden');
            if (privateChatView) privateChatView.classList.add('hidden');
            this.loadConversationList();
            this.updateChatTabBadges();
        } else {
            // 显示群聊视图
            if (groupView) groupView.classList.remove('hidden');
            if (conversationListView) conversationListView.classList.add('hidden');
            if (privateChatView) privateChatView.classList.add('hidden');
            this.loadChatMessages();
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

    // 追加单条聊天消息（用于 WebSocket 实时更新）
    appendChatMessage(msg, type) {
        // 检查是否在聊天页面且类型匹配
        const chatPage = document.getElementById('chat-page');
        if (!chatPage || !chatPage.classList.contains('active')) return;
        if (this.chatType !== type) return;

        const list = document.getElementById('message-list');
        if (!list) return;

        const item = document.createElement('div');
        item.className = 'message-item';

        const contentDiv = document.createElement('div');
        contentDiv.className = `message-content ${msg.userId === this.currentUser?.userId ? 'self' : ''}`;

        if (msg.userId === this.currentUser?.userId) {
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
        list.appendChild(item);
        Utils.scrollToBottom(list);
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
            // 刷新用户信息（世界聊天会消耗广播喇叭）
            const userResult = await userApi.getUserInfo();
            if (userResult.success) {
                this.currentUser = userResult.data;
                Storage.setUserInfo(userResult.data);
                this.updateUserInfo();
            }

            // 由于使用 WebSocket，消息会通过回调自动添加到聊天列表
            // 如果 WebSocket 未连接，则手动刷新
            if (!window.wsClient || window.wsClient.readyState !== WebSocket.OPEN) {
                this.loadChatMessages();
            }
        } else {
            Utils.showToast(result.message || '发送失败', 'error');
        }
    },

    // 启动聊天定时器
    startChatTimer() {
        this.stopChatTimer();
        // 如果 WebSocket 已连接，则不需要轮询
        // WebSocket 会实时推送新消息
        if (window.wsClient && window.wsClient.ws && window.wsClient.ws.readyState === WebSocket.OPEN) {
            console.log('WebSocket 已连接，跳过聊天轮询');
            return;
        }
        
        // 只有在 WebSocket 未连接时才启用轮询
        this.timers.chat = setInterval(() => {
            if (document.getElementById('chat-page').classList.contains('active')) {
                // 再次检查 WebSocket 状态
                if (window.wsClient && window.wsClient.ws && window.wsClient.ws.readyState === WebSocket.OPEN) {
                    this.stopChatTimer();
                    return;
                }
                this.loadChatMessages();
            }
        }, 10000); // 增加到 10 秒，减少刷新频率
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
                <div class="item-icon-wrapper">
                    <img src="${iconPath}" alt="${item.name}" onerror="this.src='assets/icons/default-avatar.svg'">
                </div>
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
            list.innerHTML = '<div class="empty-state"><div>-</div><p>暂无数据</p></div>';
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

            // 清除 token 和用户信息
            localStorage.removeItem('authToken');
            Storage.removeUserInfo();

            // 关闭 WebSocket 连接
            if (typeof wsClient !== 'undefined' && wsClient.ws) {
                wsClient.close();
            }

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
            claimableSection.innerHTML = '<h3>可领取成就</h3>';
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
            unclaimedSection.innerHTML = '<h3>未完成成就</h3>';
            container.appendChild(unclaimedSection);

            unclaimedList.forEach(ach => {
                const item = this.createAchievementItem(ach, 'unclaimed');
                container.appendChild(item);
            });
        }

        // 渲染已领取的成就（显示进度）
        const claimedSection = document.createElement('div');
        claimedSection.className = 'achievement-section';
        claimedSection.innerHTML = '<h3>已完成成就</h3>';
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
                <div class="achievement-reward">奖励: <img src="assets/icons/diamonds.svg" class="inline-icon" alt="钻石">${ach.reward.diamonds || 0} <img src="assets/icons/coins.svg" class="inline-icon" alt="金币">${ach.reward.coins || 0}</div>
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
        // 获取成就元素用于动画
        const achievementItem = document.querySelector(`.achievement-item[data-id="${achievementId}"]`) ||
                               document.querySelector('.achievement-item .claim-btn')?.closest('.achievement-item');

        const result = await achievementApi.checkAndClaimAchievement(this.currentUser.userId, achievementId);

        if (result.success) {
            // 播放成就庆祝动画
            if (achievementItem) {
                Utils.celebrate.achievement(achievementItem);
            }

            // 播放彩色纸屑
            setTimeout(() => {
                Utils.particles.createConfetti(window.innerWidth / 2, 150, 25);
            }, 200);

            // 延迟显示Toast
            setTimeout(() => {
                Utils.showToast(`成就达成！获得 ${result.data.reward.diamonds || 0} 钻石`, 'success');
            }, 500);

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
            toast.textContent = `成就解锁: ${achievement.name}！快去领取奖励`;
            toast.className = 'toast show success';

            // 播放星星粒子
            Utils.particles.createStarParticles(window.innerWidth / 2, 80, 6);

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
                <h3>每日签到</h3>
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
            const hasBonus = CONFIG.consecutiveBonus[day] ? ' *' : '';

            html += `
                <div class="${statusClass}">
                    <div class="reward-day">第 ${day} 天${hasBonus}</div>
                    <div class="reward-content">
                        <span><img src="assets/icons/diamonds.svg" class="inline-icon" alt="钻石"> ${reward.diamonds}</span>
                        <span><img src="assets/icons/coins.svg" class="inline-icon" alt="金币"> ${reward.coins}</span>
                    </div>
                    ${isCurrentDay ? '<div class="current-badge">今日</div>' : ''}
                    ${isPastDay ? '<div class="past-badge">V</div>' : ''}
                </div>
            `;
        });

        // 显示额外奖励提示
        const nextBonusDay = Object.keys(CONFIG.consecutiveBonus).find(d => parseInt(d) > consecutiveDays);
        if (nextBonusDay) {
            const bonus = CONFIG.consecutiveBonus[nextBonusDay];
            html += `
                <div class="bonus-info-card">
                    <div class="bonus-title">${nextBonusDay}天里程碑奖励</div>
                    <div class="bonus-content">
                        <img src="assets/icons/diamonds.svg" class="inline-icon" alt="钻石"> ${bonus.diamonds} + <img src="assets/icons/coins.svg" class="inline-icon" alt="金币"> ${bonus.coins} + ${bonus.itemCount}个道具
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
                        <div class="milestone-badge">明日里程碑</div>
                        <div class="milestone-content">
                            <img src="assets/icons/diamonds.svg" class="inline-icon" alt="钻石"> ${bonus.diamonds} + <img src="assets/icons/coins.svg" class="inline-icon" alt="金币"> ${bonus.coins} + ${bonus.itemCount}个${bonus.item === 'protection_shield' ? '防护盾' : bonus.item === 'speed_up' ? '加速卡' : '广播喇叭'}
                        </div>
                    </div>
                `;
            }

            html += `
                <div class="check-in-preview">
                    <div class="preview-main">
                        <span>明日签到获得: <img src="assets/icons/diamonds.svg" class="inline-icon" alt="钻石">${nextReward.diamonds} <img src="assets/icons/coins.svg" class="inline-icon" alt="金币">${nextReward.coins}</span>
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
        // 获取签到按钮元素用于动画
        const checkInBtn = document.getElementById('do-check-in');

        const result = await checkInApi.checkIn(this.currentUser.userId);

        if (result.success) {
            const reward = result.data.reward;
            const bonus = result.data.bonus;
            const consecutiveDays = result.data.consecutiveDays;

            // 播放签到庆祝动画
            if (checkInBtn) {
                Utils.celebrate.checkIn(checkInBtn);
            }

            // 播放金币和星星粒子
            setTimeout(() => {
                Utils.particles.createGoldParticles(window.innerWidth / 2, window.innerHeight / 2, 12);
                Utils.particles.createStarParticles(window.innerWidth / 2, window.innerHeight / 2 - 50, 8);
            }, 100);

            // 如果是里程碑奖励，播放更多特效
            if (bonus) {
                setTimeout(() => {
                    Utils.particles.createConfetti(window.innerWidth / 2, 100, 40);
                }, 400);
            }

            // 构建签到成功消息
            let message = `签到成功！第${consecutiveDays}天\n钻石 ${reward.diamonds} 金币 ${reward.coins}`;

            // 如果有额外奖励，添加到消息中
            if (bonus) {
                message += `\n里程碑奖励！\n钻石 ${bonus.diamonds} 金币 ${bonus.coins} + ${bonus.itemCount}个道具`;
            }

            setTimeout(() => {
                Utils.showToast(message, 'success');
            }, 300);

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
            weeklySection.innerHTML = '<h3>每周任务</h3>';
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
            challengeSection.innerHTML = '<h3>挑战任务</h3>';
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
                <div class="task-reward">奖励: <img src="assets/icons/diamonds.svg" class="inline-icon" alt="钻石">${task.reward.diamonds || 0} <img src="assets/icons/coins.svg" class="inline-icon" alt="金币">${task.reward.coins || 0}</div>
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
            Utils.showToast(`任务完成！获得 钻石${reward.diamonds || 0} 金币${reward.coins || 0}`, 'success');
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
    },

    // ==================== 增强聊天系统方法 ====================

    // 当前私聊目标用户
    currentPrivateChatTarget: null,

    // 表情选择器状态
    emojiPickerOpen: false,

    // 当前表情分类
    currentEmojiCategory: 'face',

    // 初始化增强聊天功能
    initEnhancedChat() {
        // 初始化表情选择器
        this.initEmojiPicker();

        // 初始化私聊功能
        this.initPrivateChat();

        // 更新用户在线状态
        this.updateMyOnlineStatus(true);

        // 定期更新在线状态
        setInterval(() => {
            if (this.currentUser) {
                this.updateMyOnlineStatus(true);
            }
        }, 30000);
    },

    // 初始化表情选择器
    initEmojiPicker() {
        const emojiBtn = document.getElementById('emoji-btn');
        const emojiPicker = document.getElementById('emoji-picker');

        if (emojiBtn && emojiPicker) {
            emojiBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleEmojiPicker();
            });

            // 点击外部关闭
            document.addEventListener('click', (e) => {
                if (this.emojiPickerOpen && !emojiPicker.contains(e.target) && e.target !== emojiBtn) {
                    this.closeEmojiPicker();
                }
            });
        }
    },

    // 切换表情选择器
    toggleEmojiPicker() {
        const emojiPicker = document.getElementById('emoji-picker');
        if (!emojiPicker) return;

        if (this.emojiPickerOpen) {
            this.closeEmojiPicker();
        } else {
            this.openEmojiPicker();
        }
    },

    // 打开表情选择器
    openEmojiPicker() {
        const emojiPicker = document.getElementById('emoji-picker');
        if (!emojiPicker) return;

        emojiPicker.classList.add('active');
        this.emojiPickerOpen = true;
        this.renderEmojiPicker();
    },

    // 关闭表情选择器
    closeEmojiPicker() {
        const emojiPicker = document.getElementById('emoji-picker');
        if (!emojiPicker) return;

        emojiPicker.classList.remove('active');
        this.emojiPickerOpen = false;
    },

    // 渲染表情选择器
    renderEmojiPicker() {
        const categoriesContainer = document.getElementById('emoji-categories');
        const gridContainer = document.getElementById('emoji-grid');

        if (!categoriesContainer || !gridContainer) return;

        // 渲染分类标签
        categoriesContainer.innerHTML = '';
        EmojiConfig.categories.forEach(category => {
            const btn = document.createElement('button');
            btn.className = `emoji-category-btn ${category.id === this.currentEmojiCategory ? 'active' : ''}`;
            btn.innerHTML = category.icon;
            btn.title = category.name;
            btn.addEventListener('click', () => {
                this.currentEmojiCategory = category.id;
                this.renderEmojiPicker();
            });
            categoriesContainer.appendChild(btn);
        });

        // 渲染表情网格
        gridContainer.innerHTML = '';
        const emojis = EmojiConfig.emojis[this.currentEmojiCategory] || [];
        emojis.forEach(emoji => {
            const item = document.createElement('div');
            item.className = 'emoji-item';
            item.textContent = emoji;
            item.addEventListener('click', () => {
                this.insertEmoji(emoji);
            });
            gridContainer.appendChild(item);
        });
    },

    // 插入表情到输入框
    insertEmoji(emoji) {
        const input = document.getElementById('chat-input') || document.getElementById('private-chat-input');
        if (input) {
            const start = input.selectionStart;
            const end = input.selectionEnd;
            const text = input.value;
            input.value = text.substring(0, start) + emoji + text.substring(end);
            input.focus();
            input.selectionStart = input.selectionEnd = start + emoji.length;
        }
        this.closeEmojiPicker();
    },

    // 初始化私聊功能
    initPrivateChat() {
        // 私聊发送按钮
        const privateSendBtn = document.getElementById('private-send-btn');
        const privateInput = document.getElementById('private-chat-input');

        if (privateSendBtn && privateInput) {
            privateSendBtn.addEventListener('click', () => this.sendPrivateMessage());
            privateInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendPrivateMessage();
                }
            });
        }
    },

    // 加载会话列表
    async loadConversationList() {
        if (!this.currentUser) return;

        const result = await privateChatApi.getConversationList(this.currentUser.userId);
        if (!result.success) return;

        const container = document.getElementById('conversation-list');
        if (!container) return;

        container.innerHTML = '';

        if (result.data.length === 0) {
            container.innerHTML = `
                <div class="empty-conversations">
                    <div class="empty-icon">💬</div>
                    <p>暂无私聊消息</p>
                    <p>从好友列表开始聊天吧</p>
                </div>
            `;
            return;
        }

        // 获取在线状态
        const userIds = result.data.map(c => c.targetUserId);
        const onlineStatusResult = await privateChatApi.getUserOnlineStatus(userIds);
        const onlineStatus = onlineStatusResult.data || {};

        result.data.forEach(conversation => {
            const item = this.createConversationItem(conversation, onlineStatus[conversation.targetUserId]);
            container.appendChild(item);
        });
    },

    // 创建会话列表项
    createConversationItem(conversation, onlineStatus) {
        const item = document.createElement('div');
        item.className = `conversation-item ${conversation.unreadCount > 0 ? 'has-unread' : ''}`;

        const isOnline = onlineStatus?.online || false;
        const timeStr = Utils.formatChatTime(conversation.lastMessageTime);

        // 预览文本处理
        let previewText = conversation.lastMessage || '';
        if (conversation.lastMessageType === 'emoji') {
            previewText = '[表情]';
        } else if (conversation.lastMessageType === 'image') {
            previewText = '[图片]';
        }
        if (previewText.length > 20) {
            previewText = previewText.substring(0, 20) + '...';
        }

        item.innerHTML = `
            <div class="avatar-wrapper">
                <img class="avatar" src="${conversation.targetAvatar || 'assets/icons/default-avatar.svg'}" alt="${conversation.targetNickname}">
                <span class="online-indicator ${isOnline ? 'online' : 'offline'}"></span>
            </div>
            <div class="conversation-content">
                <div class="conversation-header">
                    <span class="conversation-name">${conversation.targetNickname}</span>
                    <span class="conversation-time">${timeStr}</span>
                </div>
                <div class="conversation-preview">
                    <span class="preview-text">${previewText}</span>
                    ${conversation.unreadCount > 0 ? `<span class="unread-count">${conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}</span>` : ''}
                </div>
            </div>
        `;

        item.addEventListener('click', () => {
            this.openPrivateChat(conversation.targetUserId, conversation.targetNickname, conversation.targetAvatar);
        });

        return item;
    },

    // 打开私聊界面
    async openPrivateChat(targetUserId, targetNickname, targetAvatar) {
        this.currentPrivateChatTarget = {
            userId: targetUserId,
            nickname: targetNickname,
            avatar: targetAvatar
        };

        // 更新私聊头部信息
        const headerName = document.getElementById('private-chat-name');
        const headerAvatar = document.getElementById('private-chat-avatar');
        const headerStatus = document.getElementById('private-chat-status');

        if (headerName) headerName.textContent = targetNickname;
        if (headerAvatar) headerAvatar.src = targetAvatar || 'assets/icons/default-avatar.svg';

        // 获取在线状态
        const statusResult = await privateChatApi.getUserOnlineStatus([targetUserId]);
        const isOnline = statusResult.data?.[targetUserId]?.online || false;
        if (headerStatus) {
            headerStatus.textContent = isOnline ? '在线' : '离线';
            headerStatus.className = `user-status ${isOnline ? 'online' : ''}`;
        }

        // 标记已读
        await privateChatApi.markConversationAsRead(this.currentUser.userId, targetUserId);

        // 加载消息
        await this.loadPrivateChatMessages();

        // 显示私聊界面
        document.getElementById('conversation-list-view')?.classList.add('hidden');
        document.getElementById('private-chat-view')?.classList.remove('hidden');
    },

    // 关闭私聊界面
    closePrivateChat() {
        this.currentPrivateChatTarget = null;
        document.getElementById('private-chat-view')?.classList.add('hidden');
        document.getElementById('conversation-list-view')?.classList.remove('hidden');
        this.loadConversationList();
    },

    // 加载私聊消息
    async loadPrivateChatMessages() {
        if (!this.currentUser || !this.currentPrivateChatTarget) return;

        const result = await privateChatApi.getPrivateChatHistory(
            this.currentUser.userId,
            this.currentPrivateChatTarget.userId
        );

        if (!result.success) return;

        const container = document.getElementById('private-message-list');
        if (!container) return;

        container.innerHTML = '';

        let lastTime = 0;
        result.data.forEach(msg => {
            const showTime = Utils.shouldShowTime(msg.timestamp, lastTime);
            lastTime = msg.timestamp;

            if (showTime) {
                const timeDiv = document.createElement('div');
                timeDiv.className = 'time-divider';
                timeDiv.innerHTML = `<span>${Utils.formatChatTime(msg.timestamp)}</span>`;
                container.appendChild(timeDiv);
            }

            const messageItem = this.createPrivateMessageItem(msg);
            container.appendChild(messageItem);
        });

        Utils.scrollToBottom(container);
    },

    // 创建私聊消息项
    createPrivateMessageItem(msg) {
        const item = document.createElement('div');
        const isSelf = msg.senderId === this.currentUser.userId;
        item.className = `message-item ${isSelf ? 'message-right' : 'message-left'}`;

        // 检查是否是纯表情消息
        const isEmojiOnly = this.isEmojiOnlyMessage(msg.content);
        let bubbleClass = 'message-bubble';
        if (isEmojiOnly) bubbleClass += ' emoji-only';
        if (msg.messageType === 'image') bubbleClass += ' image-message';

        let contentHtml = msg.content;
        if (msg.messageType === 'image') {
            contentHtml = `<img src="${msg.content}" alt="图片" loading="lazy">`;
        }

        if (isSelf) {
            item.innerHTML = `
                <div class="message-content">
                    <div class="message-body">
                        <div class="${bubbleClass}">${contentHtml}</div>
                        <div class="message-status ${msg.read ? 'read' : 'sent'}"></div>
                    </div>
                    <img class="avatar" src="${msg.senderAvatar || 'assets/icons/default-avatar.svg'}" alt="">
                </div>
            `;
        } else {
            item.innerHTML = `
                <div class="message-content">
                    <img class="avatar" src="${msg.senderAvatar || 'assets/icons/default-avatar.svg'}" alt="">
                    <div class="message-body">
                        <div class="${bubbleClass}">${contentHtml}</div>
                    </div>
                </div>
            `;
        }

        return item;
    },

    // 检查是否是纯表情消息
    isEmojiOnlyMessage(content) {
        if (!content) return false;
        // 移除空格后检查是否全是表情
        const cleaned = content.replace(/\s/g, '');
        const emojiRegex = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+$/u;
        return emojiRegex.test(cleaned) && cleaned.length <= 6;
    },

    // 发送私聊消息
    async sendPrivateMessage() {
        if (!this.currentUser || !this.currentPrivateChatTarget) return;

        const input = document.getElementById('private-chat-input');
        const content = input?.value.trim();

        if (!content) {
            Utils.showToast('请输入消息内容', 'error');
            return;
        }

        // 判断消息类型
        const messageType = this.isEmojiOnlyMessage(content) ? 'emoji' : 'text';

        const result = await privateChatApi.sendPrivateMessage(
            this.currentUser.userId,
            this.currentPrivateChatTarget.userId,
            content,
            messageType
        );

        if (result.success) {
            input.value = '';
            // 由于使用 WebSocket，消息会通过回调自动更新
            // 如果 WebSocket 未连接，则手动刷新
            if (!window.wsClient || window.wsClient.readyState !== WebSocket.OPEN) {
                await this.loadPrivateChatMessages();
            }
        } else {
            Utils.showToast(result.message || '发送失败', 'error');
        }
    },

    // 处理新私聊消息（WebSocket 回调）
    handleNewPrivateMessage(msg) {
        // 如果当前正在和发送者聊天，追加消息
        if (this.currentPrivateChatTarget &&
            (msg.senderId === this.currentPrivateChatTarget.userId ||
             msg.receiverId === this.currentPrivateChatTarget.userId)) {
            this.appendPrivateMessage(msg);
        }

        // 更新未读徽章
        this.updateChatTabBadges();

        // 如果消息不是自己发的，显示通知
        if (msg.senderId !== this.currentUser?.userId) {
            Utils.showToast(`${msg.senderNickname}: ${msg.content.substring(0, 20)}...`, 'info');
        }
    },

    // 追加单条私聊消息
    appendPrivateMessage(msg) {
        const container = document.getElementById('private-message-list');
        if (!container) return;

        const messageDiv = this.createPrivateMessageElement(msg);
        container.appendChild(messageDiv);
        Utils.scrollToBottom(container);
    },

    // 创建私聊消息元素
    createPrivateMessageElement(msg) {
        const isSelf = msg.senderId === this.currentUser?.userId;
        const messageDiv = document.createElement('div');
        messageDiv.className = `private-message ${isSelf ? 'self' : 'other'}`;

        if (isSelf) {
            messageDiv.innerHTML = `
                <div class="message-right">
                    <div class="message-body">
                        <div class="message-bubble self ${msg.messageType === 'emoji' ? 'emoji-only' : ''}">${msg.content}</div>
                    </div>
                    <img class="avatar" src="${msg.senderAvatar || 'assets/icons/default-avatar.svg'}">
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-left">
                    <img class="avatar" src="${msg.senderAvatar || 'assets/icons/default-avatar.svg'}">
                    <div class="message-body">
                        <div class="message-bubble ${msg.messageType === 'emoji' ? 'emoji-only' : ''}">${msg.content}</div>
                    </div>
                </div>
            `;
        }

        return messageDiv;
    },

    // 更新自己的在线状态
    async updateMyOnlineStatus(online) {
        if (!this.currentUser) return;
        await privateChatApi.updateOnlineStatus(this.currentUser.userId, online);
    },

    // 获取私聊总未读数
    async getPrivateChatUnreadCount() {
        if (!this.currentUser) return 0;
        const result = await privateChatApi.getTotalUnreadCount(this.currentUser.userId);
        return result.data?.total || 0;
    },

    // 更新聊天标签未读徽章
    async updateChatTabBadges() {
        if (!this.currentUser) return;

        const unreadCount = await this.getPrivateChatUnreadCount();
        const privateBadge = document.getElementById('private-unread-badge');

        if (privateBadge) {
            if (unreadCount > 0) {
                privateBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                privateBadge.style.display = 'flex';
            } else {
                privateBadge.style.display = 'none';
            }
        }
    },

    // ==================== 亲密度系统 ====================

    // 当前选中的好友详情
    currentFriendDetail: null,
    // 当前选中的礼物
    selectedGiftId: null,
    // 礼物列表缓存
    giftsList: null,

    // 打开好友详情弹窗
    async openFriendDetail(friend) {
        this.currentFriendDetail = friend;

        // 加载亲密度详情
        await this.loadFriendDetail(friend.userId);

        Utils.showModal('friend-detail-modal');
    },

    // 加载好友亲密度详情
    async loadFriendDetail(friendId) {
        const result = await intimacyApi.getFriendIntimacy(friendId);
        if (!result.success) {
            Utils.showToast(result.message || '加载失败', 'error');
            return;
        }

        const data = result.data;
        const friend = this.currentFriendDetail;

        // 更新基本信息
        document.getElementById('detail-friend-avatar').src = friend.avatar || 'assets/icons/default-avatar.svg';
        document.getElementById('detail-friend-name').textContent = friend.nickname;
        document.getElementById('detail-friend-level').textContent = `Lv.${friend.level}`;

        // 更新亲密度信息
        const levelInfo = this.getIntimacyLevelInfo(data.intimacyValue);
        document.getElementById('detail-intimacy-icon').textContent = levelInfo.icon;
        document.getElementById('detail-intimacy-name').textContent = levelInfo.name;
        document.getElementById('detail-intimacy-value').textContent = data.intimacyValue;

        // 更新进度条
        const progressFill = document.getElementById('detail-intimacy-progress');
        const progress = ((data.intimacyValue - levelInfo.min) / (levelInfo.max - levelInfo.min + 1)) * 100;
        progressFill.style.width = `${Math.min(progress, 100)}%`;

        // 更新下一等级提示
        const nextLevelEl = document.getElementById('detail-next-level');
        const nextLevel = this.getNextIntimacyLevel(data.intimacyValue);
        if (nextLevel) {
            nextLevelEl.textContent = `下一等级: ${nextLevel.name} (${nextLevel.min})`;
        } else {
            nextLevelEl.textContent = '已达最高等级！';
        }

        // 更新今日获得
        document.getElementById('detail-today-gained').textContent = data.todayGained || 0;
        document.getElementById('detail-today-limit').textContent = 100;

        // 更新互动统计
        document.getElementById('detail-chat-count').textContent = data.chatCount || 0;
        document.getElementById('detail-gift-count').textContent = data.giftCount || 0;
        document.getElementById('detail-help-count').textContent = data.helpCount || 0;

        // 加载可领取奖励
        await this.loadClaimableRewards(friendId);
    },

    // 获取下一个亲密度等级
    getNextIntimacyLevel(currentValue) {
        const levels = [
            { min: 0, max: 99, name: '点头之交', icon: '👋' },
            { min: 100, max: 299, name: '普通朋友', icon: '🤝' },
            { min: 300, max: 599, name: '好朋友', icon: '😊' },
            { min: 600, max: 999, name: '亲密好友', icon: '💕' },
            { min: 1000, max: 1499, name: '挚友', icon: '❤️' },
            { min: 1500, max: 2099, name: '闺蜜/兄弟', icon: '💖' },
            { min: 2100, max: 2799, name: '知己', icon: '💝' },
            { min: 2800, max: 3599, name: '灵魂伴侣', icon: '💗' },
            { min: 3600, max: 4499, name: '命中注定', icon: '💞' },
            { min: 4500, max: 999999, name: '生死之交', icon: '💎' }
        ];

        for (let i = 0; i < levels.length; i++) {
            if (currentValue < levels[i].min) {
                return levels[i];
            }
        }
        return null;
    },

    // 加载可领取奖励
    async loadClaimableRewards(friendId) {
        const container = document.getElementById('detail-rewards-preview');
        container.innerHTML = '';

        const result = await intimacyApi.getClaimableRewards(friendId);
        if (result.success && result.data && result.data.length > 0) {
            result.data.forEach(reward => {
                const item = document.createElement('div');
                item.className = 'reward-preview-item';
                item.innerHTML = `
                    <span class="reward-preview-level">${reward.levelName}</span>
                    <span class="reward-preview-content">${this.formatRewardText(reward)}</span>
                    <button class="claim-reward-btn" data-level="${reward.level}">领取</button>
                `;
                item.querySelector('.claim-reward-btn').addEventListener('click', () => {
                    this.claimIntimacyReward(friendId, reward.level);
                });
                container.appendChild(item);
            });
        }
    },

    // 格式化奖励文本
    formatRewardText(reward) {
        const parts = [];
        if (reward.coins) parts.push(`${reward.coins}金币`);
        if (reward.diamonds) parts.push(`${reward.diamonds}钻石`);
        if (reward.items && reward.items.length > 0) {
            reward.items.forEach(item => {
                parts.push(`${item.name}x${item.count}`);
            });
        }
        return parts.join(' + ') || '神秘奖励';
    },

    // 领取亲密度等级奖励
    async claimIntimacyReward(friendId, level) {
        const result = await intimacyApi.claimReward(friendId, level);
        if (result.success) {
            Utils.showToast('奖励领取成功！', 'success');

            // 刷新用户信息
            const userResult = await userApi.getUserInfo();
            if (userResult.success) {
                this.currentUser = userResult.data;
                Storage.setUserInfo(userResult.data);
                this.updateUserInfo();
            }

            // 重新加载奖励列表
            await this.loadClaimableRewards(friendId);
        } else {
            Utils.showToast(result.message || '领取失败', 'error');
        }
    },

    // 打开送礼弹窗
    async openGiftModal(friendId) {
        if (!this.currentFriendDetail) return;

        // 更新目标名称
        document.getElementById('gift-target-name').textContent = this.currentFriendDetail.nickname;

        // 更新用户余额
        document.getElementById('gift-my-coins').textContent = this.currentUser?.coins || 0;
        document.getElementById('gift-my-diamonds').textContent = this.currentUser?.diamonds || 0;

        // 加载礼物列表
        await this.renderGiftGrid();

        // 重置选中状态
        this.selectedGiftId = null;
        document.getElementById('confirm-gift-btn').disabled = true;
        document.getElementById('confirm-gift-btn').textContent = '选择礼物后发送';
        document.getElementById('gift-message').value = '';

        Utils.showModal('gift-modal');
    },

    // 渲染礼物网格
    async renderGiftGrid() {
        const container = document.getElementById('gift-grid');
        container.innerHTML = '';

        // 获取礼物列表
        if (!this.giftsList) {
            const result = await intimacyApi.getGifts();
            if (result.success) {
                this.giftsList = result.data;
            } else {
                // 使用默认礼物列表
                this.giftsList = [
                    { id: 'flower', name: '鲜花', price: 50, currency: 'coins', intimacy: 10, icon: '🌹', category: 'small' },
                    { id: 'chocolate', name: '巧克力', price: 100, currency: 'coins', intimacy: 15, icon: '🍫', category: 'small' },
                    { id: 'cake', name: '蛋糕', price: 200, currency: 'coins', intimacy: 25, icon: '🎂', category: 'medium' },
                    { id: 'perfume', name: '香水', price: 500, currency: 'coins', intimacy: 50, icon: '💐', category: 'medium' },
                    { id: 'watch', name: '手表', price: 1000, currency: 'coins', intimacy: 80, icon: '⌚', category: 'large' },
                    { id: 'necklace', name: '项链', price: 50, currency: 'diamonds', intimacy: 100, icon: '📿', category: 'large' },
                    { id: 'car', name: '跑车', price: 200, currency: 'diamonds', intimacy: 200, icon: '🚗', category: 'luxury' },
                    { id: 'castle', name: '城堡', price: 500, currency: 'diamonds', intimacy: 500, icon: '🏰', category: 'luxury' }
                ];
            }
        }

        this.giftsList.forEach(gift => {
            const item = document.createElement('div');
            item.className = 'gift-item';
            item.dataset.giftId = gift.id;

            const currencyIcon = gift.currency === 'diamonds' ? 'diamonds.svg' : 'coins.svg';

            item.innerHTML = `
                <span class="gift-icon">${gift.icon}</span>
                <span class="gift-name">${gift.name}</span>
                <span class="gift-price">
                    <img src="assets/icons/${currencyIcon}" alt="">
                    ${gift.price}
                </span>
                <span class="gift-intimacy">+${gift.intimacy}</span>
            `;

            item.addEventListener('click', () => {
                this.selectGift(gift);
            });

            container.appendChild(item);
        });
    },

    // 选择礼物
    selectGift(gift) {
        // 移除之前的选中状态
        document.querySelectorAll('.gift-item').forEach(item => {
            item.classList.remove('selected');
        });

        // 添加选中状态
        const selectedItem = document.querySelector(`.gift-item[data-gift-id="${gift.id}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }

        this.selectedGiftId = gift.id;

        // 更新确认按钮
        const confirmBtn = document.getElementById('confirm-gift-btn');
        confirmBtn.disabled = false;

        const currencyText = gift.currency === 'diamonds' ? '钻石' : '金币';
        confirmBtn.textContent = `送出 ${gift.name} (${gift.price}${currencyText})`;
    },

    // 发送礼物
    async sendGift() {
        if (!this.selectedGiftId || !this.currentFriendDetail) {
            Utils.showToast('请先选择礼物', 'error');
            return;
        }

        const message = document.getElementById('gift-message').value.trim();

        const result = await intimacyApi.sendGift(
            this.currentFriendDetail.userId,
            this.selectedGiftId,
            message
        );

        if (result.success) {
            Utils.showToast(`成功送出礼物，亲密度 +${result.data.intimacyGain}`, 'success');

            // 刷新用户信息
            const userResult = await userApi.getUserInfo();
            if (userResult.success) {
                this.currentUser = userResult.data;
                Storage.setUserInfo(userResult.data);
                this.updateUserInfo();
            }

            // 关闭礼物弹窗
            Utils.hideModal('gift-modal');

            // 刷新好友详情
            await this.loadFriendDetail(this.currentFriendDetail.userId);
        } else {
            Utils.showToast(result.message || '送礼失败', 'error');
        }
    },

    // 从好友详情发起私聊
    startChatFromDetail() {
        if (!this.currentFriendDetail) return;

        Utils.hideModal('friend-detail-modal');
        this.startPrivateChatFromFriend(this.currentFriendDetail);
    },

    // 从好友详情拜访
    visitFromDetail() {
        if (!this.currentFriendDetail) return;

        Utils.hideModal('friend-detail-modal');
        this.visitFriendStation(this.currentFriendDetail.userId);
    },

    // 绑定亲密度相关事件
    bindIntimacyEvents() {
        // 好友详情弹窗
        const friendDetailModal = document.getElementById('friend-detail-modal');
        if (friendDetailModal) {
            // 点击遮罩关闭
            friendDetailModal.addEventListener('click', (e) => {
                if (e.target === friendDetailModal || e.target.classList.contains('modal-overlay')) {
                    Utils.hideModal('friend-detail-modal');
                }
            });

            // 关闭按钮
            const closeBtn = friendDetailModal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => Utils.hideModal('friend-detail-modal'));
            }

            // 送礼按钮
            const sendGiftBtn = document.getElementById('detail-send-gift-btn');
            if (sendGiftBtn) {
                sendGiftBtn.addEventListener('click', () => {
                    this.openGiftModal(this.currentFriendDetail?.userId);
                });
            }

            // 私聊按钮
            const chatBtn = document.getElementById('detail-chat-btn');
            if (chatBtn) {
                chatBtn.addEventListener('click', () => this.startChatFromDetail());
            }

            // 拜访按钮
            const visitBtn = document.getElementById('detail-visit-btn');
            if (visitBtn) {
                visitBtn.addEventListener('click', () => this.visitFromDetail());
            }
        }

        // 送礼弹窗
        const giftModal = document.getElementById('gift-modal');
        if (giftModal) {
            // 点击遮罩关闭
            giftModal.addEventListener('click', (e) => {
                if (e.target === giftModal || e.target.classList.contains('modal-overlay')) {
                    Utils.hideModal('gift-modal');
                }
            });

            // 关闭按钮
            const closeBtn = giftModal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => Utils.hideModal('gift-modal'));
            }

            // 确认送礼按钮
            const confirmGiftBtn = document.getElementById('confirm-gift-btn');
            if (confirmGiftBtn) {
                confirmGiftBtn.addEventListener('click', () => this.sendGift());
            }
        }
    },

    // 从好友列表发起私聊
    startPrivateChatFromFriend(member) {
        // 切换到聊天页面
        this.switchToPage('chat');

        // 切换到私聊标签
        document.querySelectorAll('.chat-tab').forEach(t => t.classList.remove('active'));
        const privateTab = document.querySelector('.chat-tab[data-type="private"]');
        if (privateTab) {
            privateTab.classList.add('active');
            this.chatType = 'private';
        }

        // 打开与该好友的私聊
        setTimeout(() => {
            this.openPrivateChat(member.userId, member.nickname, member.avatar);
        }, 100);
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

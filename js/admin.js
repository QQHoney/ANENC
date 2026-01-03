const Admin = {
    init() {
        this.bindEvents();
        this.checkLogin();
    },

    bindEvents() {
        // 登录
        document.getElementById('login-btn').addEventListener('click', () => this.login());
        document.getElementById('admin-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });

        // 退出
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());

        // 保存用户数据
        document.getElementById('save-user-btn').addEventListener('click', () => this.saveUserData());

        // 封禁/解封
        document.getElementById('ban-user-btn').addEventListener('click', () => this.toggleBan(true));
        document.getElementById('unban-user-btn').addEventListener('click', () => this.toggleBan(false));

        // 清除数据
        document.getElementById('clear-data-btn').addEventListener('click', () => {
            if (confirm('警告：此操作将清除所有游戏存档，且不可恢复！确定要继续吗？')) {
                Storage.clearAll();
                alert('数据已清除');
                location.reload();
            }
        });
    },

    checkLogin() {
        if (sessionStorage.getItem('adminLoggedIn') === 'true') {
            this.showDashboard();
        }
    },

    login() {
        const password = document.getElementById('admin-password').value;
        if (password === 'admin') { // 默认密码
            sessionStorage.setItem('adminLoggedIn', 'true');
            this.showDashboard();
        } else {
            alert('密码错误');
        }
    },

    logout() {
        sessionStorage.removeItem('adminLoggedIn');
        location.reload();
    },

    showDashboard() {
        document.getElementById('admin-login').classList.remove('active');
        document.getElementById('admin-dashboard').classList.add('active');
        this.loadUserData();
    },

    loadUserData() {
        const userInfo = Storage.getUserInfo();
        if (!userInfo) {
            document.getElementById('user-info-panel').innerHTML = '<p>暂无玩家数据</p>';
            return;
        }

        // 显示基本信息
        document.getElementById('user-nickname').textContent = userInfo.nickname;
        document.getElementById('user-id').textContent = userInfo.userId;

        // 显示状态
        const statusEl = document.getElementById('user-status');
        const banBtn = document.getElementById('ban-user-btn');
        const unbanBtn = document.getElementById('unban-user-btn');

        if (userInfo.isBanned) {
            statusEl.textContent = '已封禁';
            statusEl.className = 'status-badge banned';
            banBtn.style.display = 'none';
            unbanBtn.style.display = 'inline-block';
        } else {
            statusEl.textContent = '正常';
            statusEl.className = 'status-badge normal';
            banBtn.style.display = 'inline-block';
            unbanBtn.style.display = 'none';
        }

        // 填充编辑框
        document.getElementById('edit-coins').value = userInfo.coins;
        document.getElementById('edit-diamonds').value = userInfo.diamonds;
        document.getElementById('edit-level').value = userInfo.level;
        document.getElementById('edit-exp').value = userInfo.exp;
    },

    saveUserData() {
        const userInfo = Storage.getUserInfo();
        if (!userInfo) return;

        userInfo.coins = parseInt(document.getElementById('edit-coins').value) || 0;
        userInfo.diamonds = parseInt(document.getElementById('edit-diamonds').value) || 0;
        userInfo.level = parseInt(document.getElementById('edit-level').value) || 1;
        userInfo.exp = parseInt(document.getElementById('edit-exp').value) || 0;

        Storage.setUserInfo(userInfo);
        alert('修改已保存');
        this.loadUserData();
    },

    toggleBan(isBanned) {
        const userInfo = Storage.getUserInfo();
        if (!userInfo) return;

        if (isBanned) {
            if (!confirm('确定要封禁该玩家吗？封禁后玩家将无法登录。')) return;
        }

        userInfo.isBanned = isBanned;
        Storage.setUserInfo(userInfo);
        alert(isBanned ? '玩家已封禁' : '玩家已解封');
        this.loadUserData();
    }
};

// 初始化
Admin.init();

// 工具函数
const Utils = {
    // 格式化剩余时间
    formatRemainTime(ms) {
        if (ms <= 0) return '已完成';

        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) {
            return seconds + '秒';
        }

        const minutes = Math.floor(seconds / 60);
        const remainSeconds = seconds % 60;

        if (minutes < 60) {
            return remainSeconds > 0 ? `${minutes}分${remainSeconds}秒` : `${minutes}分钟`;
        }

        const hours = Math.floor(minutes / 60);
        const remainMinutes = minutes % 60;
        return remainMinutes > 0 ? `${hours}小时${remainMinutes}分` : `${hours}小时`;
    },

    // 格式化生长时间
    formatGrowTime(seconds) {
        if (seconds >= 3600) {
            return Math.floor(seconds / 3600) + '小时';
        } else if (seconds >= 60) {
            return Math.floor(seconds / 60) + '分钟';
        } else {
            return seconds + '秒';
        }
    },

    // 格式化时间戳
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) { // 1分钟内
            return '刚刚';
        } else if (diff < 3600000) { // 1小时内
            return Math.floor(diff / 60000) + '分钟前';
        } else if (diff < 86400000) { // 24小时内
            return Math.floor(diff / 3600000) + '小时前';
        } else if (diff < 172800000) { // 48小时内
            return '昨天';
        } else {
            const month = date.getMonth() + 1;
            const day = date.getDate();
            return `${month}月${day}日`;
        }
    },

    // 格式化聊天时间
    formatChatTime(timestamp) {
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    },

    // 显示Toast
    showToast(message, type = 'info', duration = 2000) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast show';
        if (type === 'success') {
            toast.classList.add('success');
        } else if (type === 'error') {
            toast.classList.add('error');
        }

        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    },

    // 显示弹窗
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    },

    // 隐藏弹窗
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    },

    // 切换页面
    switchPage(pageId, options = {}) {
        console.log('Utils.switchPage 切换到:', pageId);

        // 隐藏所有页面
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => {
            page.classList.remove('active');
            page.style.display = 'none';
        });

        // 显示目标页面
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            targetPage.style.display = 'flex';
            console.log('页面切换成功:', pageId);
        } else {
            console.error('页面未找到:', pageId);
        }
    },

    // 生成唯一ID
    generateId(prefix = 'id') {
        return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // 数字格式化（K、M等）
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    },

    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // 节流函数
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // 检查消息是否需要显示时间
    shouldShowTime(currentTime, lastTime) {
        if (!lastTime) return true;
        return currentTime - lastTime > 300000; // 5分钟
    },

    // 滚动到底部
    scrollToBottom(element) {
        if (element) {
            element.scrollTop = element.scrollHeight;
        }
    },

    // ==================== 高级视觉效果系统 ====================

    // 粒子效果管理器
    particles: {
        container: null,

        // 初始化粒子容器
        init() {
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.className = 'particles-container';
                this.container.id = 'particles-container';
                document.body.appendChild(this.container);
            }
            return this.container;
        },

        // 创建金币粒子
        createGoldParticles(x, y, count = 8) {
            this.init();
            for (let i = 0; i < count; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle gold';
                particle.style.left = x + 'px';
                particle.style.top = y + 'px';
                particle.style.width = (8 + Math.random() * 8) + 'px';
                particle.style.height = particle.style.width;

                // 随机方向
                const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
                const distance = 50 + Math.random() * 80;
                const tx = Math.cos(angle) * distance;
                const ty = Math.sin(angle) * distance - 30;

                particle.style.setProperty('--tx', tx + 'px');
                particle.style.setProperty('--ty', ty + 'px');
                particle.style.animation = `particle-burst 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`;
                particle.style.animationDelay = (i * 0.03) + 's';

                this.container.appendChild(particle);

                setTimeout(() => particle.remove(), 1000);
            }
        },

        // 创建星星粒子
        createStarParticles(x, y, count = 6) {
            this.init();
            for (let i = 0; i < count; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle star';
                particle.style.left = (x + (Math.random() - 0.5) * 60) + 'px';
                particle.style.top = (y + (Math.random() - 0.5) * 60) + 'px';
                particle.style.width = (12 + Math.random() * 8) + 'px';
                particle.style.height = particle.style.width;
                particle.style.animation = `particle-sparkle 1s ease-out forwards`;
                particle.style.animationDelay = (i * 0.1) + 's';

                this.container.appendChild(particle);

                setTimeout(() => particle.remove(), 1200);
            }
        },

        // 创建彩色纸屑
        createConfetti(x, y, count = 20) {
            this.init();
            const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];

            for (let i = 0; i < count; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle confetti';
                particle.style.left = (x + (Math.random() - 0.5) * 100) + 'px';
                particle.style.top = y + 'px';
                particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                particle.style.animationDuration = (2 + Math.random() * 2) + 's';
                particle.style.animationDelay = (Math.random() * 0.5) + 's';

                this.container.appendChild(particle);

                setTimeout(() => particle.remove(), 5000);
            }
        },

        // 创建浮动数字效果
        createFloatingNumber(x, y, text, color = '#FFD700') {
            this.init();
            const element = document.createElement('div');
            element.className = 'number-pop-effect';
            element.textContent = text;
            element.style.left = x + 'px';
            element.style.top = y + 'px';
            element.style.color = color;

            this.container.appendChild(element);

            setTimeout(() => element.remove(), 1000);
        },

        // 清除所有粒子
        clear() {
            if (this.container) {
                this.container.innerHTML = '';
            }
        }
    },

    // 庆祝效果
    celebrate: {
        // 货物收取庆祝
        harvest(element, expGain, goldGain) {
            if (!element) return;

            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // 添加收取动画
            element.classList.add('harvest-celebrate');

            // 创建金币粒子
            Utils.particles.createGoldParticles(centerX, centerY, 10);

            // 创建星星粒子
            setTimeout(() => {
                Utils.particles.createStarParticles(centerX, centerY, 5);
            }, 100);

            // 显示经验值增加
            if (expGain) {
                Utils.particles.createFloatingNumber(centerX - 20, centerY - 20, '+' + expGain + ' EXP', '#4CAF50');
            }

            // 显示金币增加
            if (goldGain) {
                setTimeout(() => {
                    Utils.particles.createFloatingNumber(centerX + 20, centerY - 40, '+' + goldGain, '#FFD700');
                }, 200);
            }

            // 震动反馈（如果支持）
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        },

        // 成就解锁庆祝
        achievement(element) {
            if (!element) return;

            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // 添加成就解锁效果
            element.classList.add('achievement-unlock');

            // 大量彩色纸屑
            Utils.particles.createConfetti(centerX, centerY - 50, 30);

            // 星星粒子
            Utils.particles.createStarParticles(centerX, centerY, 10);

            // 震动反馈
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            }

            setTimeout(() => {
                element.classList.remove('achievement-unlock');
            }, 1500);
        },

        // 升级庆祝
        levelUp(element, newLevel) {
            if (!element) return;

            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // 添加升级光效
            element.classList.add('level-up-effect');

            // 大量金色粒子
            Utils.particles.createGoldParticles(centerX, centerY, 15);

            // 彩色纸屑
            setTimeout(() => {
                Utils.particles.createConfetti(centerX, 0, 40);
            }, 300);

            // 显示新等级
            Utils.particles.createFloatingNumber(centerX, centerY - 30, 'LV.' + newLevel, '#FFD700');

            // 长震动
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100, 50, 200]);
            }

            setTimeout(() => {
                element.classList.remove('level-up-effect');
            }, 2000);
        },

        // 签到成功庆祝
        checkIn(element) {
            if (!element) return;

            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // 星星粒子
            Utils.particles.createStarParticles(centerX, centerY, 8);

            // 金币粒子
            Utils.particles.createGoldParticles(centerX, centerY, 6);

            // 添加弹性效果
            element.classList.add('elastic-pop');

            setTimeout(() => {
                element.classList.remove('elastic-pop');
            }, 600);
        }
    },

    // 微交互效果
    microInteraction: {
        // 按钮点击涟漪
        addRipple(element) {
            if (!element) return;

            element.classList.add('ripple-effect');

            element.addEventListener('click', function(e) {
                const rect = element.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const ripple = document.createElement('span');
                ripple.style.cssText = `
                    position: absolute;
                    left: ${x}px;
                    top: ${y}px;
                    width: 0;
                    height: 0;
                    background: rgba(255, 255, 255, 0.4);
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                    animation: ripple-expand 0.6s ease-out forwards;
                    pointer-events: none;
                `;

                element.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
            });
        },

        // 悬浮3D倾斜效果
        add3DTilt(element, intensity = 10) {
            if (!element) return;

            element.style.transformStyle = 'preserve-3d';
            element.style.transition = 'transform 0.1s ease-out';

            element.addEventListener('mousemove', function(e) {
                const rect = element.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -intensity;
                const rotateY = ((x - centerX) / centerX) * intensity;

                element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
            });

            element.addEventListener('mouseleave', function() {
                element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)';
            });
        },

        // 添加闪光扫过效果
        addShineEffect(element) {
            if (!element) return;
            element.classList.add('shine-effect');
        },

        // 添加呼吸灯效果
        addBreathingGlow(element, color = '#FF6B00') {
            if (!element) return;
            element.style.setProperty('--glow-color', color);
            element.classList.add('breathing-glow');
        },

        // 移除呼吸灯效果
        removeBreathingGlow(element) {
            if (!element) return;
            element.classList.remove('breathing-glow');
        }
    },

    // 数字动画
    animateNumber(element, start, end, duration = 1000, suffix = '') {
        if (!element) return;

        const startTime = performance.now();
        const diff = end - start;

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // 缓动函数
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + diff * easeOut);

            element.textContent = current + suffix;

            // 添加翻转效果
            if (progress < 1) {
                element.classList.add('flip-number');
                setTimeout(() => element.classList.remove('flip-number'), 150);
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    },

    // 货位卡片增强
    enhanceCargoSlot(slotElement) {
        if (!slotElement) return;

        // 添加3D倾斜效果
        this.microInteraction.add3DTilt(slotElement, 8);

        // 添加点击涟漪
        this.microInteraction.addRipple(slotElement);
    },

    // 初始化所有视觉增强
    initVisualEnhancements() {
        // 初始化粒子容器
        this.particles.init();

        // 为所有主要按钮添加涟漪效果
        document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => {
            this.microInteraction.addRipple(btn);
        });

        // 为货位添加3D效果
        document.querySelectorAll('.cargo-slot').forEach(slot => {
            this.enhanceCargoSlot(slot);
        });

        // 为商店商品添加闪光效果
        document.querySelectorAll('.shop-item').forEach(item => {
            this.microInteraction.addShineEffect(item);
        });

        console.log('视觉增强系统已初始化');
    }
};

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
    }
};

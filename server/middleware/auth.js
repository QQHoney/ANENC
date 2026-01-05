/**
 * 安能物流农场游戏 - JWT 认证中间件
 */

const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: '未提供认证令牌' });
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: '认证令牌无效或已过期' });
    }
}

// 可选认证（不强制）
function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.userId = decoded.userId;
            req.user = decoded;
        } catch (error) {
            // 忽略无效令牌
        }
    }
    next();
}

module.exports = { authMiddleware, optionalAuth };

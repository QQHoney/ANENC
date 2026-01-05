/**
 * 安能物流农场游戏 - 数据库连接模块
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// 创建连接池
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
});

// 测试连接
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('数据库连接成功');
        connection.release();
        return true;
    } catch (error) {
        console.error('数据库连接失败:', error.message);
        return false;
    }
}

// 通用查询方法
async function query(sql, params = []) {
    const [rows] = await pool.execute(sql, params);
    return rows;
}

// 获取单行
async function queryOne(sql, params = []) {
    const rows = await query(sql, params);
    return rows[0] || null;
}

// 插入并返回 ID
async function insert(sql, params = []) {
    const [result] = await pool.execute(sql, params);
    return result.insertId;
}

// 更新/删除并返回影响行数
async function update(sql, params = []) {
    const [result] = await pool.execute(sql, params);
    return result.affectedRows;
}

module.exports = {
    pool,
    query,
    queryOne,
    insert,
    update,
    testConnection
};

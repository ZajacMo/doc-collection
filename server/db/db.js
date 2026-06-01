// 数据库连接模块
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径 - 确保与迁移脚本使用相同的路径
const dbPath = path.join(__dirname, 'database.db');
console.log('数据库文件路径:', dbPath);

// 创建数据库连接
let db;

/**
 * 初始化数据库连接
 * @returns {Promise} 数据库连接对象
 */
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    try {
      // 创建数据库连接
      db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
          console.error('连接数据库失败:', err.message);
          reject(err);
          return;
        }
        console.log('成功连接到SQLite数据库');
        resolve(db);
      });
    } catch (error) {
      console.error('初始化数据库失败:', error);
      reject(error);
    }
  });
};

/**
 * 获取数据库连接
 * @returns {Object} 数据库连接对象
 */
const getDb = () => {
  if (!db) {
    throw new Error('数据库尚未初始化');
  }
  return db;
};

/**
 * 确保数据库 schema 是最新的
 * 检查并添加必要的列（如 password）
 */
const ensureSchema = () => {
  return new Promise((resolve, reject) => {
    try {
      const db = getDb();

      // 检查 users 表是否有 password 列
      db.all("PRAGMA table_info(users)", (err, columns) => {
        if (err) {
          console.error('检查表结构失败:', err.message);
          reject(err);
          return;
        }

        const hasPassword = columns.some(col => col.name === 'password');
        if (!hasPassword) {
          db.run('ALTER TABLE users ADD COLUMN password TEXT', (alterErr) => {
            if (alterErr) {
              console.error('添加 password 列失败:', alterErr.message);
              reject(alterErr);
              return;
            }
            console.log('成功添加 password 列到 users 表');
            resolve();
          });
        } else {
          resolve();
        }
      });
    } catch (error) {
      console.error('确保 schema 失败:', error);
      reject(error);
    }
  });
};

/**
 * 关闭数据库连接
 */
const closeDb = () => {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('关闭数据库连接失败:', err.message);
      } else {
        console.log('数据库连接已关闭');
        db = null;
      }
    });
  }
};

module.exports = {
  initDatabase,
  getDb,
  closeDb,
  ensureSchema
};
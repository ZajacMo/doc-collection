// 数据库测试脚本
const { initDatabase, getDb, closeDb } = require('./db');

async function testDatabase() {
  try {
    // 初始化数据库连接
    await initDatabase();
    const db = getDb();
    
    console.log('数据库连接成功');
    
    // 检查users表是否存在
    const tables = await new Promise((resolve, reject) => {
      db.all(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users';",
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
    
    if (tables.length > 0) {
      console.log('users表存在');
      
      // 尝试查询用户数据
      const users = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM users LIMIT 5;', (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
      
      console.log('查询到的用户数据:', users);
    } else {
      console.log('users表不存在');
      
      // 尝试直接创建所有表
      await new Promise((resolve, reject) => {
        // 创建users表
        db.run(
          `CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            studentId TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'student',
            className TEXT,
            major TEXT,
            email TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
          );`,
          (err) => {
            if (err) {
              reject(err);
              return;
            }
            console.log('已创建users表');
            
            // 创建assignments表
            db.run(
              `CREATE TABLE IF NOT EXISTS assignments (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                deadline TEXT NOT NULL,
                createTime TEXT NOT NULL,
                updateTime TEXT NOT NULL,
                namingRule TEXT NOT NULL,
                fileTypes TEXT NOT NULL
              );`,
              (err) => {
                if (err) {
                  reject(err);
                  return;
                }
                console.log('已创建assignments表');
                
                // 创建submissions表
                db.run(
                  `CREATE TABLE IF NOT EXISTS submissions (
                    id TEXT PRIMARY KEY,
                    studentId TEXT NOT NULL,
                    assignmentId TEXT NOT NULL,
                    fileName TEXT NOT NULL,
                    filePath TEXT NOT NULL,
                    fileSize INTEGER NOT NULL,
                    description TEXT,
                    submitTime TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'submitted'
                  );`,
                  (err) => {
                    if (err) {
                      reject(err);
                      return;
                    }
                    console.log('已创建submissions表');
                    
                    // 插入默认管理员
                    db.run(
                      `INSERT OR IGNORE INTO users (id, studentId, name, role) VALUES (?, ?, ?, ?)`,
                      ['1', 'admin', '管理员', 'admin'],
                      (err) => {
                        if (err) {
                          console.error('插入管理员失败:', err.message);
                        } else {
                          console.log('已插入默认管理员');
                        }
                        resolve();
                      }
                    );
                  }
                );
              }
            );
          }
        );
      });
    }
  } catch (error) {
    console.error('测试数据库失败:', error.message);
  } finally {
    closeDb();
  }
}

testDatabase();
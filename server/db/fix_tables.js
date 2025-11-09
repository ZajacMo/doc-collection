// 修复数据库表结构脚本
const { initDatabase, getDb, closeDb } = require('./db');

async function fixTables() {
  try {
    // 初始化数据库连接
    await initDatabase();
    const db = getDb();
    
    console.log('数据库连接成功');
    
    // 检查并创建assignments表
    await new Promise((resolve, reject) => {
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
          } else {
            console.log('已确保assignments表存在');
            resolve();
          }
        }
      );
    });
    
    // 检查并创建submissions表
    await new Promise((resolve, reject) => {
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
          } else {
            console.log('已确保submissions表存在');
            resolve();
          }
        }
      );
    });
    
    // 验证所有表是否都存在
    const tables = await new Promise((resolve, reject) => {
      db.all(
        "SELECT name FROM sqlite_master WHERE type='table';",
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(row => row.name));
          }
        }
      );
    });
    
    console.log('数据库中的表:', tables);
    
  } catch (error) {
    console.error('修复表结构失败:', error.message);
  } finally {
    closeDb();
  }
}

fixTables();
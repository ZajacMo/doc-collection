// 数据库测试脚本
const { initDatabase, getDb, closeDb } = require('./db');

const runAsync = (db, sql, params = []) =>
  new Promise((resolve, reject) => db.run(sql, params, function(err) {
    err ? reject(err) : resolve({ lastID: this.lastID, changes: this.changes });
  }));

async function testDatabase() {
  try {
    await initDatabase();
    const db = getDb();
    console.log('数据库连接成功');

    const tables = await new Promise((resolve, reject) => {
      db.all(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users';",
        (err, rows) => err ? reject(err) : resolve(rows)
      );
    });

    if (tables.length > 0) {
      console.log('users表存在');
      return;
    }

    console.log('users表不存在，自动创建...');
    await runAsync(db, `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, studentId TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student', className TEXT, major TEXT,
      email TEXT, password TEXT, createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );`);
    console.log('已创建users表');

    await runAsync(db, `CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT,
      deadline TEXT NOT NULL, createTime TEXT NOT NULL, updateTime TEXT NOT NULL,
      fileTypes TEXT NOT NULL, namingRule TEXT, relativeStudents TEXT
    );`);
    console.log('已创建assignments表');

    await runAsync(db, `CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY, studentId TEXT NOT NULL, assignmentId TEXT NOT NULL,
      fileName TEXT NOT NULL, filePath TEXT NOT NULL, fileSize INTEGER NOT NULL,
      description TEXT, submitTime TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'submitted'
    );`);
    console.log('已创建submissions表');

    await runAsync(db, `INSERT OR IGNORE INTO users (id, studentId, name, role) VALUES (?, ?, ?, ?)`,
      ['1', 'admin', '管理员', 'admin']);
    console.log('已插入默认管理员');
  } catch (error) {
    console.error('测试数据库失败:', error.message);
  } finally {
    await closeDb();
  }
}

testDatabase();
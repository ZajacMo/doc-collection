// 测试Excel数据导入是否成功
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, 'server/db/database.db');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message);
    return;
  }
  console.log('成功连接到SQLite数据库');
  
  // 查询用户表中的数据
  db.all('SELECT id, studentId, name, role, className, major FROM users LIMIT 20', (err, rows) => {
    if (err) {
      console.error('查询用户数据失败:', err.message);
      return;
    }
    
    console.log('\n数据库中的用户数据（最多20条）:');
    console.log('----------------------------------------');
    console.log('ID | 学号 | 姓名 | 角色 | 班级 | 专业');
    console.log('----------------------------------------');
    
    rows.forEach(row => {
      console.log(`${row.id} | ${row.studentId} | ${row.name} | ${row.role} | ${row.className || '-'} | ${row.major || '-'}`);
    });
    
    console.log('----------------------------------------');
    console.log(`总共查询到 ${rows.length} 条用户记录`);
    
    // 关闭数据库连接
    db.close((err) => {
      if (err) {
        console.error('关闭数据库连接失败:', err.message);
      } else {
        console.log('\n数据库连接已关闭');
      }
    });
  });
});
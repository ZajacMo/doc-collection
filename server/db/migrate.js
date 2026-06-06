// 数据库迁移脚本
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const XLSX = require('@e965/xlsx');
const { initDatabase, getDb, closeDb } = require('./db');

// 包装db.run为Promise版本
const runQuery = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
};

// 包装db.all为Promise版本
const runAllQuery = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// 确保迁移脚本使用与应用相同的数据库连接

/**
 * 创建数据库表
 */
const createTables = async () => {
  const db = getDb();
  
  // 禁用外键检查以避免创建顺序问题
  await runQuery(db, 'PRAGMA foreign_keys = OFF');
  
  try {
    // 创建 migrations 表来记录迁移版本
    await runQuery(db, `
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        appliedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 检查此迁移是否已执行
    const migrationExists = await new Promise((resolve) => {
      db.get('SELECT 1 FROM migrations WHERE name = ?', ['init_v1'], (err, row) => {
        resolve(!!row);
      });
    });

    if (migrationExists) {
      console.log('迁移 init_v1 已执行，跳过表创建');
      return;
    }

    // 仅在表不存在时创建（保留已有数据）
    await runQuery(db, `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        studentId TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        className TEXT,
        major TEXT,
        email TEXT,
        password TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await runQuery(db, `
      CREATE TABLE IF NOT EXISTS assignments (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        deadline TEXT NOT NULL,
        createTime TEXT NOT NULL,
        updateTime TEXT NOT NULL,
        fileTypes TEXT NOT NULL,
        namingRule TEXT,
        relativeStudents TEXT
      );
    `);

    await runQuery(db, `
      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        studentId TEXT NOT NULL,
        assignmentId TEXT NOT NULL,
        fileName TEXT NOT NULL,
        filePath TEXT NOT NULL,
        fileSize INTEGER NOT NULL,
        description TEXT,
        submitTime TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'submitted'
      );
    `);

    // 记录迁移已执行
    await runQuery(db, `INSERT INTO migrations (name) VALUES ('init_v1')`);

    console.log('数据库表创建成功');
  } catch (error) {
    console.error('创建表失败:', error);
    throw error;
  } finally {
    // 重新启用外键检查
    await runQuery(db, 'PRAGMA foreign_keys = ON');
  }
};

/**
 * 为 assignments 表添加 maxFileSize 列
 */
const addMaxFileSizeColumn = async () => {
  const db = getDb();

  try {
    // 检查此迁移是否已执行
    const migrationExists = await new Promise((resolve) => {
      db.get('SELECT 1 FROM migrations WHERE name = ?', ['add_max_file_size_v2'], (err, row) => {
        resolve(!!row);
      });
    });

    if (migrationExists) {
      console.log('迁移 add_max_file_size_v2 已执行，跳过');
      return;
    }

    // 检查列是否已存在（防御性）
    const columns = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(assignments)", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const hasColumn = columns.some(col => col.name === 'maxFileSize');
    if (!hasColumn) {
      await runQuery(db, 'ALTER TABLE assignments ADD COLUMN maxFileSize INTEGER NOT NULL DEFAULT 20');
      console.log('已为 assignments 表添加 maxFileSize 列');
    }

    // 回填现有数据（理论上 DEFAULT 已处理，但显式更新更安全）
    const envMaxMB = Math.floor((parseInt(process.env.MAX_FILE_SIZE) || 20971520) / (1024 * 1024));
    await runQuery(db, 'UPDATE assignments SET maxFileSize = ? WHERE maxFileSize IS NULL OR maxFileSize = 0', [envMaxMB]);

    // 记录迁移已执行
    await runQuery(db, `INSERT INTO migrations (name) VALUES ('add_max_file_size_v2')`);
    console.log('迁移 add_max_file_size_v2 完成');
  } catch (error) {
    console.error('添加 maxFileSize 列失败:', error);
    throw error;
  }
};

/**
 * 创建 classes 表和 user_classes 关联表（仅建表，不迁移数据）
 */
const migrateClassTable = async () => {
  const db = getDb();

  try {
    // 检查此迁移是否已执行
    const migrationExists = await new Promise((resolve) => {
      db.get('SELECT 1 FROM migrations WHERE name = ?', ['create_class_tables_v3'], (err, row) => {
        resolve(!!row);
      });
    });

    if (migrationExists) {
      console.log('迁移 create_class_tables_v3 已执行，跳过');
      return;
    }

    // 创建 classes 表
    await runQuery(db, `
      CREATE TABLE IF NOT EXISTS classes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        grade TEXT,
        description TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('classes 表创建成功');

    // 创建 user_classes 关联表
    await runQuery(db, `
      CREATE TABLE IF NOT EXISTS user_classes (
        user_id TEXT NOT NULL,
        class_id TEXT NOT NULL,
        PRIMARY KEY (user_id, class_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
      );
    `);
    console.log('user_classes 关联表创建成功');

    // 记录迁移已执行
    await runQuery(db, `INSERT INTO migrations (name) VALUES ('create_class_tables_v3')`);
    console.log('迁移 create_class_tables_v3 完成');
  } catch (error) {
    console.error('创建班级表失败:', error);
    throw error;
  }
};

/**
 * 同步 users.className → classes + user_classes（幂等，可多次执行）
 * 用于应用启动时自动同步，也用于 Excel 导入后同步新用户的班级
 */
const syncClassNameToClasses = async () => {
  const db = getDb();

  try {
    // 检查表是否存在（防御性）
    const tableCheck = await runAllQuery(db, "SELECT name FROM sqlite_master WHERE type='table' AND name='classes'");
    if (tableCheck.length === 0) {
      console.log('classes 表不存在，跳过班级同步');
      return;
    }

    // 获取所有有 className 但缺少 user_classes 关联的用户
    const usersWithClass = await runAllQuery(db, `
      SELECT u.id, u.className
      FROM users u
      WHERE u.className IS NOT NULL AND u.className != ''
        AND NOT EXISTS (
          SELECT 1 FROM user_classes uc WHERE uc.user_id = u.id
        )
    `);

    if (usersWithClass.length === 0) {
      return; // 没有需要同步的数据
    }

    console.log(`发现 ${usersWithClass.length} 个用户需要同步班级数据`);

    // 收集去重的班级名称
    const classNameMap = new Map();
    for (const user of usersWithClass) {
      const normalizedName = user.className.trim();
      if (!classNameMap.has(normalizedName)) {
        classNameMap.set(normalizedName, []);
      }
      classNameMap.get(normalizedName).push(user.id);
    }

    // 获取当前最大班级ID
    const maxIdRow = await new Promise((resolve) => {
      db.get('SELECT MAX(CAST(id AS INTEGER)) as maxId FROM classes', (err, row) => {
        resolve(row || { maxId: 0 });
      });
    });
    let classIdCounter = (maxIdRow?.maxId || 0) + 1;

    let createdClasses = 0;
    let linkedUsers = 0;

    for (const [className, userIds] of classNameMap.entries()) {
      // 先检查班级是否已存在
      const existingClass = await new Promise((resolve) => {
        db.get('SELECT id FROM classes WHERE name = ?', [className], (err, row) => {
          resolve(row);
        });
      });

      let classId;
      if (existingClass) {
        classId = existingClass.id;
      } else {
        classId = classIdCounter.toString();
        await runQuery(db, 'INSERT INTO classes (id, name) VALUES (?, ?)', [classId, className]);
        classIdCounter++;
        createdClasses++;
      }

      // 为每个用户创建关联
      for (const userId of userIds) {
        await runQuery(db,
          'INSERT OR IGNORE INTO user_classes (user_id, class_id) VALUES (?, ?)',
          [userId, classId]
        );
        linkedUsers++;
      }
    }

    if (createdClasses > 0 || linkedUsers > 0) {
      console.log(`班级同步完成：创建 ${createdClasses} 个新班级，关联 ${linkedUsers} 个用户`);
    }
  } catch (error) {
    console.error('同步班级数据失败:', error);
    // 不抛出错误，避免阻断启动流程
  }
};

/**
 * 从Excel文件导入用户数据
 */
const importUsersFromExcel = async () => {
  const db = getDb();
  // 现在从server/data目录读取Excel文件
  const excelPath = path.join(__dirname, '../data/名单.xls');
  
  try {
    // 插入默认用户（默认密码为学号）
    const defaultUsers = [
      { id: '1', studentId: 'admin', name: '管理员', role: 'admin' },
      { id: '2', studentId: 'super', name: '超级管理员', role: 'super_admin' },
      { id: '3', studentId: '2023001', name: '张三', role: 'student' },
      { id: '4', studentId: '2023002', name: '李四', role: 'student' },
      { id: '5', studentId: '2023003', name: '王五', role: 'student' }
    ];

    for (const user of defaultUsers) {
      const hashedPassword = await bcrypt.hash(user.studentId, 10);
      await runQuery(
        db,
        `INSERT OR IGNORE INTO users (id, studentId, name, role, password) VALUES (?, ?, ?, ?, ?)`,
        [user.id, user.studentId, user.name, user.role, hashedPassword]
      );
    }

    if (fs.existsSync(excelPath)) {
      const workbook = XLSX.readFile(excelPath);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);

      let count = 0;
      for (const [index, row] of data.entries()) {
        const userId = (defaultUsers.length + index + 1).toString();
        const studentId = row['学号'] || `student${defaultUsers.length + index + 1}`;
        const name = row['姓名'] || `User${defaultUsers.length + index + 1}`;
        const hashedPassword = await bcrypt.hash(studentId, 10);

        await runQuery(
          db,
          `INSERT OR IGNORE INTO users (id, studentId, name, role, className, major, email, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, studentId, name, 'student', row['班级'] || '', row['专业'] || '', row['邮箱'] || '', hashedPassword]
        );
        count++;
      }

      console.log(`成功从Excel导入了 ${count} 个用户数据`);
    } else {
      console.log('Excel文件不存在，仅使用默认用户数据');
    }
  } catch (error) {
    console.error('导入用户数据失败:', error);
    // 继续执行，不中断整个迁移过程
  }
};

/**
 * 从JSON文件导入作业数据
 */
const importAssignments = async () => {
  const db = getDb();
  const assignmentsPath = path.join(__dirname, '../data/assignments.json');
  
  try {
    if (fs.existsSync(assignmentsPath)) {
      const assignments = JSON.parse(fs.readFileSync(assignmentsPath, 'utf8'));
      
      for (const assignment of assignments) {
        if (assignment.id && assignment.title) {
          await db.run(
            `INSERT OR IGNORE INTO assignments (id, title, description, deadline, createTime, updateTime, fileTypes) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              assignment.id,
              assignment.title,
              assignment.description || '',
              assignment.deadline || new Date().toISOString(),
              assignment.createTime || new Date().toISOString(),
              assignment.updateTime || new Date().toISOString(),
              JSON.stringify(assignment.fileTypes || ['pdf', 'doc', 'docx'])
            ]
          );
        }
      }
      
      console.log(`成功导入了 ${assignments.length} 个作业数据`);
    }
  } catch (error) {
    console.error('导入作业数据失败:', error);
    // 继续执行，不中断整个迁移过程
  }
};

/**
 * 从JSON文件导入提交数据
 */
const importSubmissions = async () => {
  const db = getDb();
  const submissionsPath = path.join(__dirname, '../data/submissions.json');
  
  try {
    if (fs.existsSync(submissionsPath)) {
      const submissions = JSON.parse(fs.readFileSync(submissionsPath, 'utf8'));
      
      for (const submission of submissions) {
        if (submission.id && submission.studentId && submission.assignmentId) {
          await db.run(
            `INSERT OR IGNORE INTO submissions (id, studentId, assignmentId, fileName, filePath, fileSize, description, submitTime, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              submission.id,
              submission.studentId,
              submission.assignmentId,
              submission.fileName || '',
              submission.filePath || '',
              submission.fileSize || 0,
              submission.description || '',
              submission.submitTime || new Date().toISOString(),
              submission.status || 'submitted'
            ]
          );
        }
      }
      
      console.log(`成功导入了 ${submissions.length} 个提交数据`);
    }
  } catch (error) {
    console.error('导入提交数据失败:', error);
    // 继续执行，不中断整个迁移过程
  }
};

/**
 * 执行数据库迁移
 * @param {Object} options - 迁移选项
 * @param {boolean} options.initDb - 是否初始化数据库（默认 true）
 * @param {boolean} options.closeConnection - 迁移完成后是否关闭连接（默认 true）
 * @param {boolean} options.syncClasses - 是否同步 className 到 classes 表（默认 true）
 */
const runMigration = async (options = {}) => {
  const { initDb = true, closeConnection = true, syncClasses = true } = options;

  try {
    // 仅在需要时初始化数据库连接
    if (initDb) {
      await initDatabase();
    }

    // 创建表
    await createTables();

    // 导入数据
    await importUsersFromExcel();
    await importAssignments();
    await importSubmissions();

    // 添加 maxFileSize 列
    await addMaxFileSizeColumn();

    // 创建班级表（仅建表，不迁移数据）
    await migrateClassTable();

    // 同步 className → classes（幂等，每次启动都可安全执行）
    if (syncClasses) {
      await syncClassNameToClasses();
    }

    console.log('数据库迁移完成');
  } catch (error) {
    console.error('数据库迁移失败:', error.message);
    if (closeConnection) {
      process.exit(1);
    }
    throw error;
  } finally {
    // 仅在需要时关闭数据库连接
    if (closeConnection) {
      closeDb();
    }
  }
};

// 如果直接运行此脚本，则执行迁移
if (require.main === module) {
  runMigration();
}

module.exports = {
  runMigration,
  syncClassNameToClasses
};
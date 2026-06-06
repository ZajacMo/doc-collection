// 数据库连接模块
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径 - 使用 data/ 子目录，避免与源码文件冲突
const dbPath = path.join(__dirname, 'data', 'database.db');
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
          });
        }

        // 检查 assignments 表是否有 maxFileSize 列
        db.all("PRAGMA table_info(assignments)", (err2, assignmentColumns) => {
          if (err2) {
            console.error('检查 assignments 表结构失败:', err2.message);
            reject(err2);
            return;
          }
          const hasMaxFileSize = assignmentColumns.some(col => col.name === 'maxFileSize');
          if (!hasMaxFileSize) {
            db.run('ALTER TABLE assignments ADD COLUMN maxFileSize INTEGER NOT NULL DEFAULT 20', (alterErr2) => {
              if (alterErr2) {
                console.error('添加 maxFileSize 列失败:', alterErr2.message);
                reject(alterErr2);
                return;
              }
              console.log('成功添加 maxFileSize 列到 assignments 表');
              resolve();
            });
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('确保 schema 失败:', error);
      reject(error);
    }
  });
};

/**
 * 为 password 为 NULL 或空字符串的现有用户填充默认密码
 * 默认密码使用学号的 bcrypt 哈希
 */
const seedDefaultPasswords = (db) => {
  return new Promise((resolve, reject) => {
    const bcrypt = require('bcryptjs');
    db.all("SELECT id, studentId FROM users WHERE password IS NULL OR password = ''", (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      if (rows.length === 0) {
        resolve();
        return;
      }

      const stmt = db.prepare('UPDATE users SET password = ? WHERE id = ?');
      let completed = 0;
      let hasError = false;

      rows.forEach(row => {
        const hashed = bcrypt.hashSync(row.studentId, 10);
        stmt.run(hashed, row.id, (runErr) => {
          if (hasError) return;
          if (runErr) {
            hasError = true;
            stmt.finalize();
            reject(runErr);
            return;
          }
          completed++;
          if (completed === rows.length) {
            stmt.finalize();
            console.log(`已为 ${rows.length} 个用户初始化默认密码`);
            resolve();
          }
        });
      });
    });
  });
};

/**
 * 初始化 RBAC 表结构（角色、权限、角色权限关联）
 * 在应用启动时调用，确保表存在并填充默认数据
 */
const initRbacSchema = () => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.serialize(() => {
      // 创建角色表
      db.run(`
        CREATE TABLE IF NOT EXISTS roles (
          id TEXT PRIMARY KEY,
          code TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          description TEXT,
          is_system INTEGER NOT NULL DEFAULT 0
        )
      `);

      // 创建权限表
      db.run(`
        CREATE TABLE IF NOT EXISTS permissions (
          id TEXT PRIMARY KEY,
          code TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          description TEXT,
          module TEXT NOT NULL
        )
      `);

      // 创建角色权限关联表
      db.run(`
        CREATE TABLE IF NOT EXISTS role_permissions (
          role_id TEXT NOT NULL,
          permission_id TEXT NOT NULL,
          PRIMARY KEY (role_id, permission_id),
          FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
          FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }
        // 表创建完成后，填充默认数据
        seedRbacData(db).then(resolve).catch(reject);
      });
    });
  });
};

/**
 * 填充默认角色和权限数据
 */
const seedRbacData = (db) => {
  return new Promise((resolve, reject) => {
    const defaultRoles = [
      { id: 'role_super_admin', code: 'super_admin', name: '超级管理员', description: '拥有所有权限，可管理角色和权限', is_system: 1 },
      { id: 'role_admin', code: 'admin', name: '管理员', description: '可管理用户、作业、提交', is_system: 1 },
      { id: 'role_student', code: 'student', name: '学生', description: '可查看作业和提交文件', is_system: 1 }
    ];

    const defaultPermissions = [
      // 用户管理
      { id: 'perm_user_read', code: 'user:read', name: '查看用户', description: '查看用户列表和详情', module: 'user' },
      { id: 'perm_user_create', code: 'user:create', name: '创建用户', description: '创建新用户', module: 'user' },
      { id: 'perm_user_update', code: 'user:update', name: '编辑用户', description: '编辑用户信息', module: 'user' },
      { id: 'perm_user_delete', code: 'user:delete', name: '删除用户', description: '删除用户', module: 'user' },
      { id: 'perm_user_reset_password', code: 'user:reset_password', name: '重置密码', description: '重置用户密码', module: 'user' },
      // 作业管理
      { id: 'perm_assignment_read', code: 'assignment:read', name: '查看作业', description: '查看作业列表和详情', module: 'assignment' },
      { id: 'perm_assignment_create', code: 'assignment:create', name: '创建作业', description: '创建新作业', module: 'assignment' },
      { id: 'perm_assignment_update', code: 'assignment:update', name: '编辑作业', description: '编辑作业信息', module: 'assignment' },
      { id: 'perm_assignment_delete', code: 'assignment:delete', name: '删除作业', description: '删除作业', module: 'assignment' },
      // 提交管理
      { id: 'perm_submission_read', code: 'submission:read', name: '查看提交', description: '查看提交记录', module: 'submission' },
      { id: 'perm_submission_create', code: 'submission:create', name: '提交作业', description: '学生提交作业文件', module: 'submission' },
      { id: 'perm_submission_delete', code: 'submission:delete', name: '删除提交', description: '删除提交记录', module: 'submission' },
      { id: 'perm_submission_download_all', code: 'submission:download_all', name: '批量下载', description: '批量下载作业提交', module: 'submission' },
      // 角色权限管理（仅超级管理员）
      { id: 'perm_role_read', code: 'role:read', name: '查看角色', description: '查看角色列表', module: 'role' },
      { id: 'perm_role_create', code: 'role:create', name: '创建角色', description: '创建新角色', module: 'role' },
      { id: 'perm_role_update', code: 'role:update', name: '编辑角色', description: '编辑角色信息和权限', module: 'role' },
      { id: 'perm_role_delete', code: 'role:delete', name: '删除角色', description: '删除自定义角色', module: 'role' },
      { id: 'perm_permission_read', code: 'permission:read', name: '查看权限', description: '查看权限列表', module: 'permission' },
      { id: 'perm_permission_assign', code: 'permission:assign', name: '分配权限', description: '为角色分配权限', module: 'permission' }
    ];

    // 角色权限映射
    const rolePermissionMap = {
      role_super_admin: defaultPermissions.map(p => p.id),
      role_admin: [
        'perm_user_read', 'perm_user_create', 'perm_user_update', 'perm_user_delete', 'perm_user_reset_password',
        'perm_assignment_read', 'perm_assignment_create', 'perm_assignment_update', 'perm_assignment_delete',
        'perm_submission_read', 'perm_submission_delete', 'perm_submission_download_all',
        'perm_permission_read'
      ],
      role_student: [
        'perm_assignment_read',
        'perm_submission_read', 'perm_submission_create'
      ]
    };

    db.serialize(() => {
      // 插入角色（忽略已存在）
      const roleStmt = db.prepare(`INSERT OR IGNORE INTO roles (id, code, name, description, is_system) VALUES (?, ?, ?, ?, ?)`);
      defaultRoles.forEach(r => roleStmt.run(r.id, r.code, r.name, r.description, r.is_system));
      roleStmt.finalize();

      // 插入权限（忽略已存在）
      const permStmt = db.prepare(`INSERT OR IGNORE INTO permissions (id, code, name, description, module) VALUES (?, ?, ?, ?, ?)`);
      defaultPermissions.forEach(p => permStmt.run(p.id, p.code, p.name, p.description, p.module));
      permStmt.finalize();

      // 插入角色权限关联（忽略已存在）
      const rpStmt = db.prepare(`INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`);
      Object.entries(rolePermissionMap).forEach(([roleId, permIds]) => {
        permIds.forEach(permId => rpStmt.run(roleId, permId));
      });
      rpStmt.finalize((err) => {
        if (err) reject(err);
        else {
          console.log('RBAC 默认数据初始化完成');
          resolve();
        }
      });
    });
  });
};

/**
 * 关闭数据库连接
 */
const closeDb = () => {
  return new Promise((resolve) => {
    if (!db) {
      resolve();
      return;
    }
    db.close((err) => {
      if (err) {
        console.error('关闭数据库连接失败:', err.message);
      } else {
        console.log('数据库连接已关闭');
      }
      db = null;
      resolve();
    });
  });
};

/**
 * 获取指定角色的所有权限 code 列表
 * @param {string} roleCode - 角色代码（如 'admin', 'student'）
 * @returns {Promise<string[]>} 权限 code 数组
 */
const getRolePermissions = (roleCode) => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.all(
      `SELECT p.code FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       JOIN roles r ON r.id = rp.role_id
       WHERE r.code = ?`,
      [roleCode],
      (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows.map(r => r.code));
      }
    );
  });
};

module.exports = {
  initDatabase,
  getDb,
  closeDb,
  ensureSchema,
  initRbacSchema,
  getRolePermissions
};
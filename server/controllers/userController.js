// 用户控制器
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/db');

/**
 * 执行SQL查询
 * @param {string} sql - SQL语句
 * @param {Array} params - 参数数组
 * @returns {Promise<Array>} 查询结果
 */
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('查询数据库失败:', err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

/**
 * 执行SQL语句（插入、更新、删除）
 * @param {string} sql - SQL语句
 * @param {Array} params - 参数数组
 * @returns {Promise<Object>} 执行结果
 */
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.run(sql, params, function(err) {
      if (err) {
        console.error('执行SQL失败:', err.message);
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

/**
 * 获取单个用户
 * @param {string} sql - SQL语句
 * @param {Array} params - 参数数组
 * @returns {Promise<Object|null>} 用户对象或null
 */
const getOne = async (sql, params = []) => {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
};

// 查询用户公开字段（排除 password）
const USER_FIELDS = 'id, studentId, name, role, className, major, email, createdAt';

/**
 * 为用户对象附加关联的班级列表
 * @param {Object} user - 用户对象
 * @returns {Object} 附加 classes 数组后的用户对象
 */
const attachUserClasses = async (user) => {
  if (!user) return user;
  const classes = await query(
    `SELECT c.id, c.name, c.grade
     FROM classes c
     JOIN user_classes uc ON c.id = uc.class_id
     WHERE uc.user_id = ?
     ORDER BY c.name`,
    [user.id]
  );
  user.classes = classes || [];
  return user;
};

/**
 * 为多个用户对象附加关联的班级列表
 */
const attachUsersClasses = async (users) => {
  if (!Array.isArray(users) || users.length === 0) return users;
  const userIds = users.map(u => u.id);
  const placeholders = userIds.map(() => '?').join(',');
  const classRows = await query(
    `SELECT uc.user_id, c.id, c.name, c.grade
     FROM classes c
     JOIN user_classes uc ON c.id = uc.class_id
     WHERE uc.user_id IN (${placeholders})
     ORDER BY c.name`,
    userIds
  );

  const classMap = new Map();
  for (const row of classRows) {
    if (!classMap.has(row.user_id)) {
      classMap.set(row.user_id, []);
    }
    classMap.get(row.user_id).push({ id: row.id, name: row.name, grade: row.grade });
  }

  for (const user of users) {
    user.classes = classMap.get(user.id) || [];
  }
  return users;
};

/**
 * 设置用户的班级关联（覆盖式）
 * @param {string} userId - 用户ID
 * @param {string[]} classIds - 班级ID数组
 */
const setUserClasses = async (userId, classIds) => {
  if (!Array.isArray(classIds)) return;
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.run('DELETE FROM user_classes WHERE user_id = ?', [userId], (err) => {
        if (err) {
          db.run('ROLLBACK');
          reject(err);
          return;
        }
        if (classIds.length > 0) {
          const stmt = db.prepare('INSERT OR IGNORE INTO user_classes (user_id, class_id) VALUES (?, ?)');
          let completed = 0;
          let hasError = false;
          for (const classId of classIds) {
            stmt.run(userId, classId, (runErr) => {
              if (hasError) return;
              if (runErr) {
                hasError = true;
                stmt.finalize();
                db.run('ROLLBACK');
                reject(runErr);
                return;
              }
              completed++;
              if (completed === classIds.length) {
                stmt.finalize();
                db.run('COMMIT', (commitErr) => {
                  if (commitErr) reject(commitErr);
                  else resolve();
                });
              }
            });
          }
        } else {
          db.run('COMMIT', (commitErr) => {
            if (commitErr) reject(commitErr);
            else resolve();
          });
        }
      });
    });
  });
};

/**
 * 生成下一个用户 ID（基于现有最大整数值 +1）
 */
const generateNextId = async () => {
  const maxIdRow = await getOne('SELECT MAX(CAST(id AS INTEGER)) as maxId FROM users');
  return ((maxIdRow?.maxId || 0) + 1).toString();
};

// 获取所有用户
exports.getAllUsers = async (req, res) => {
  try {
    const users = await query(`SELECT ${USER_FIELDS} FROM users`);
    await attachUsersClasses(users);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: '获取用户列表失败', error: error.message });
  }
};

// 获取单个用户
exports.getUserById = async (req, res) => {
  try {
    const user = await getOne(`SELECT ${USER_FIELDS} FROM users WHERE id = ?`, [req.params.id]);
    if (user) {
      await attachUserClasses(user);
      res.json(user);
    } else {
      res.status(404).json({ message: '用户不存在' });
    }
  } catch (error) {
    res.status(500).json({ message: '获取用户信息失败', error: error.message });
  }
};

// 创建用户
exports.createUser = async (req, res) => {
  try {
    // 生成下一个用户 ID
    const newId = await generateNextId();

    const { studentId, name, role = 'student', className = '', major = '', email = '', password, classIds = [] } = req.body;
    if (!studentId || typeof studentId !== 'string' || studentId.trim() === '') {
      return res.status(400).json({ message: '学号不能为空' });
    }
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ message: '姓名不能为空' });
    }
    // 如果没有提供密码，默认使用学号；始终进行 bcrypt 哈希存储
    const plainPassword = password || studentId;
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    await run(
      'INSERT INTO users (id, studentId, name, role, className, major, email, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [newId, studentId, name, role, className, major, email, hashedPassword]
    );

    // 设置班级关联
    if (Array.isArray(classIds) && classIds.length > 0) {
      await setUserClasses(newId, classIds);
    }

    const newUser = {
      id: newId,
      studentId,
      name,
      role,
      className,
      major,
      email,
      classes: []
    };
    await attachUserClasses(newUser);

    res.status(201).json(newUser);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      res.status(400).json({ message: '学号已存在' });
    } else {
      res.status(500).json({ message: '创建用户失败', error: error.message });
    }
  }
};

// 更新用户
exports.updateUser = async (req, res) => {
  try {
    const { studentId, name, role, className, major, email, password, classIds } = req.body;

    // 构建更新字段
    const updates = [];
    const params = [];

    if (studentId !== undefined) {
      updates.push('studentId = ?');
      params.push(studentId);
    }
    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (role !== undefined) {
      updates.push('role = ?');
      params.push(role);
    }
    if (className !== undefined) {
      updates.push('className = ?');
      params.push(className);
    }
    if (major !== undefined) {
      updates.push('major = ?');
      params.push(major);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email);
    }
    if (password !== undefined) {
      updates.push('password = ?');
      params.push(await bcrypt.hash(password, 10));
    }

    // 处理班级关联更新
    if (classIds !== undefined) {
      if (Array.isArray(classIds)) {
        await setUserClasses(req.params.id, classIds);
      }
    }

    if (updates.length === 0 && classIds === undefined) {
      return res.status(400).json({ message: '没有要更新的字段' });
    }

    if (updates.length > 0) {
      // 添加ID参数
      params.push(req.params.id);

      const result = await run(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      if (result.changes === 0) {
        // 检查一下用户是否存在（可能只更新了classIds）
        const userExists = await getOne('SELECT id FROM users WHERE id = ?', [req.params.id]);
        if (!userExists) {
          return res.status(404).json({ message: '用户不存在' });
        }
      }
    }

    const updatedUser = await getOne(`SELECT ${USER_FIELDS} FROM users WHERE id = ?`, [req.params.id]);
    await attachUserClasses(updatedUser);
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: '更新用户失败', error: error.message });
  }
};

// 删除用户
exports.deleteUser = async (req, res) => {
  try {
    // 先查询用户信息以获取学号，用于级联删除提交记录
    const user = await getOne('SELECT studentId FROM users WHERE id = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 级联删除该用户的所有提交记录
    await run('DELETE FROM submissions WHERE studentId = ?', [user.studentId]);

    // 删除用户
    const result = await run('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (result.changes > 0) {
      res.json({ message: '用户删除成功' });
    } else {
      res.status(404).json({ message: '用户不存在' });
    }
  } catch (error) {
    res.status(500).json({ message: '删除用户失败', error: error.message });
  }
};

// 批量创建用户
exports.batchCreateUsers = async (req, res) => {
  try {
    const { users } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ message: '用户数据不能为空' });
    }

    const results = {
      successCount: 0,
      failedCount: 0,
      errors: []
    };

    // 获取当前最大ID作为起始值
    let nextId = parseInt(await generateNextId(), 10);

    for (const userData of users) {
      const { studentId, name, role = 'student', className = '', major = '', email = '', classIds = [] } = userData;

      // 校验必填字段
      if (!studentId || !name) {
        results.failedCount++;
        results.errors.push({ studentId: studentId || '', reason: '缺少学号或姓名' });
        continue;
      }

      // 检查学号是否已存在
      const existingUser = await getOne('SELECT id FROM users WHERE studentId = ?', [studentId]);
      if (existingUser) {
        results.failedCount++;
        results.errors.push({ studentId, reason: '学号已存在' });
        continue;
      }

      try {
        const hashedPassword = await bcrypt.hash(studentId, 10);
        const currentId = nextId.toString();
        await run(
          'INSERT INTO users (id, studentId, name, role, className, major, email, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [currentId, studentId, name, role, className, major, email, hashedPassword]
        );

        // 设置班级关联
        if (Array.isArray(classIds) && classIds.length > 0) {
          await setUserClasses(currentId, classIds);
        }

        nextId++;
        results.successCount++;
      } catch (error) {
        results.failedCount++;
        results.errors.push({ studentId, reason: error.message || '插入失败' });
      }
    }

    res.json({
      message: `批量导入完成，成功 ${results.successCount} 条，失败 ${results.failedCount} 条`,
      ...results
    });
  } catch (error) {
    console.error('批量创建用户失败:', error);
    res.status(500).json({ message: '批量创建用户失败', error: error.message });
  }
};

// 用户登录
exports.loginUser = async (req, res) => {
  try {
    const { studentId, password } = req.body;

    // 查找用户
    const user = await getOne('SELECT * FROM users WHERE studentId = ?', [studentId]);

    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }

    // 密码验证：强制使用 bcrypt 哈希（不再兼容明文密码）
    if (!user.password) {
      return res.status(500).json({ message: '用户密码未初始化，请联系管理员重置密码' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      // 加载用户权限
      const { getRolePermissions } = require('../db/db');
      const permissions = await getRolePermissions(user.role);

      const token = jwt.sign(
        { id: user.id, studentId: user.studentId, name: user.name, role: user.role, permissions },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );
      res.json({
        message: '登录成功',
        token,
        user: {
          id: user.id,
          studentId: user.studentId,
          name: user.name,
          role: user.role,
          permissions
        }
      });
    } else {
      res.status(401).json({ message: '密码错误' });
    }
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '登录失败', error: error.message });
  }
};

// 修改密码
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.params.id;
    const currentUser = req.user;

    // 权限校验：普通用户只能修改自己的密码，管理员可以修改任意用户密码
    if (currentUser.role !== 'admin' && currentUser.id !== userId) {
      return res.status(403).json({ message: '只能修改自己的密码' });
    }

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: '旧密码和新密码不能为空' });
    }

    if (newPassword.length < 6 || newPassword.length > 20) {
      return res.status(400).json({ message: '新密码长度需在 6 到 20 个字符之间' });
    }

    // 查找用户
    const user = await getOne('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 验证旧密码（移除明文兼容，强制使用 bcrypt）
    if (!user.password) {
      return res.status(500).json({ message: '用户密码未初始化，请联系管理员重置密码' });
    }
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return res.status(401).json({ message: '旧密码错误' });
    }

    // 更新密码（bcrypt 哈希）
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await run('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);

    res.json({ message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({ message: '修改密码失败', error: error.message });
  }
};

// 重置密码（管理员功能）
exports.resetPassword = async (req, res) => {
  try {
    const userId = req.params.id;

    // 查找用户
    const user = await getOne('SELECT studentId FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 重置密码为学号（bcrypt 哈希）
    const hashedPassword = await bcrypt.hash(user.studentId, 10);
    await run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

    res.json({ message: '密码重置成功', defaultPassword: user.studentId });
  } catch (error) {
    console.error('重置密码错误:', error);
    res.status(500).json({ message: '重置密码失败', error: error.message });
  }
};
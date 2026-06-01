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

// 获取所有用户
exports.getAllUsers = async (req, res) => {
  try {
    const users = await query('SELECT id, studentId, name, role, className, major, email, createdAt FROM users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: '获取用户列表失败', error: error.message });
  }
};

// 获取单个用户
exports.getUserById = async (req, res) => {
  try {
    const user = await getOne('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (user) {
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
    // 确保 password 列存在（兼容已有数据库）
    try {
      const db = getDb();
      await new Promise((resolve) => db.run('ALTER TABLE users ADD COLUMN password TEXT', () => resolve()));
    } catch {
      // 列已存在时忽略
    }

    // 获取最大ID
    const maxIdRow = await getOne('SELECT MAX(CAST(id AS INTEGER)) as maxId FROM users');
    const newId = (maxIdRow?.maxId || 0) + 1;

    const { studentId, name, role = 'student', className = '', major = '', email = '', password } = req.body;
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
      [newId.toString(), studentId, name, role, className, major, email, hashedPassword]
    );

    const newUser = {
      id: newId.toString(),
      studentId,
      name,
      role,
      className,
      major,
      email
    };

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
    const { studentId, name, role, className, major, email, password } = req.body;

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

    if (updates.length === 0) {
      return res.status(400).json({ message: '没有要更新的字段' });
    }

    // 添加ID参数
    params.push(req.params.id);

    const result = await run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.changes > 0) {
      const updatedUser = await getOne('SELECT * FROM users WHERE id = ?', [req.params.id]);
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: '用户不存在' });
    }
  } catch (error) {
    res.status(500).json({ message: '更新用户失败', error: error.message });
  }
};

// 删除用户
exports.deleteUser = async (req, res) => {
  try {
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

// 用户登录
exports.loginUser = async (req, res) => {
  try {
    const { studentId, password } = req.body;
    
    // 查找用户
    const user = await getOne('SELECT * FROM users WHERE studentId = ?', [studentId]);
    // console.log('查询到的用户:', user);
    // await new Promise(resolve => setTimeout(resolve, 5000));

    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }

    // 密码验证：优先使用 bcrypt 哈希，兼容无 password 字段的旧用户
    let isPasswordValid = false;
    if (user.password) {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      isPasswordValid = password === user.studentId;
    }

    if (isPasswordValid) {
      const token = jwt.sign(
        { id: user.id, studentId: user.studentId, name: user.name, role: user.role },
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
          role: user.role
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
// 用户控制器
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
    const users = await query('SELECT * FROM users');
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
    // 获取最大ID
    const maxIdRow = await getOne('SELECT MAX(CAST(id AS INTEGER)) as maxId FROM users');
    const newId = (maxIdRow?.maxId || 0) + 1;
    
    const { studentId, name, role = 'student', className = '', major = '', email = '' } = req.body;
    
    await run(
      'INSERT INTO users (id, studentId, name, role, className, major, email) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [newId.toString(), studentId, name, role, className, major, email]
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
    const { studentId, name, role, className, major, email } = req.body;
    
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
    
    // 这里简化处理，实际应该使用密码哈希验证
    // 暂时使用学号作为密码
    if (password === user.studentId) {

      res.json({
        message: '登录成功',
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
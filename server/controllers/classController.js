// 班级控制器
const { getDb } = require('../db/db');

/**
 * 执行SQL查询
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
 * 获取单个记录
 */
const getOne = async (sql, params = []) => {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
};

/**
 * 生成下一个班级 ID
 */
const generateNextId = async () => {
  const maxIdRow = await getOne('SELECT MAX(CAST(id AS INTEGER)) as maxId FROM classes');
  return ((maxIdRow?.maxId || 0) + 1).toString();
};

// 班级公开字段
const CLASS_FIELDS = 'id, name, grade, description, createdAt';

// 获取所有班级
exports.getAllClasses = async (req, res) => {
  try {
    const classes = await query(`SELECT ${CLASS_FIELDS} FROM classes ORDER BY createdAt DESC`);
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: '获取班级列表失败', error: error.message });
  }
};

// 获取单个班级
exports.getClassById = async (req, res) => {
  try {
    const cls = await getOne(`SELECT ${CLASS_FIELDS} FROM classes WHERE id = ?`, [req.params.id]);
    if (cls) {
      res.json(cls);
    } else {
      res.status(404).json({ message: '班级不存在' });
    }
  } catch (error) {
    res.status(500).json({ message: '获取班级信息失败', error: error.message });
  }
};

// 创建班级
exports.createClass = async (req, res) => {
  try {
    const newId = await generateNextId();
    const { name, grade = '', description = '' } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ message: '班级名称不能为空' });
    }

    await run(
      'INSERT INTO classes (id, name, grade, description) VALUES (?, ?, ?, ?)',
      [newId, name.trim(), grade.trim(), description.trim()]
    );

    const newClass = await getOne(`SELECT ${CLASS_FIELDS} FROM classes WHERE id = ?`, [newId]);
    res.status(201).json(newClass);
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ message: '班级名称已存在' });
    } else {
      res.status(500).json({ message: '创建班级失败', error: error.message });
    }
  }
};

// 更新班级
exports.updateClass = async (req, res) => {
  try {
    const { name, grade, description } = req.body;

    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name.trim());
    }
    if (grade !== undefined) {
      updates.push('grade = ?');
      params.push(grade.trim());
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description.trim());
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: '没有要更新的字段' });
    }

    params.push(req.params.id);

    const result = await run(
      `UPDATE classes SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.changes > 0) {
      const updatedClass = await getOne(`SELECT ${CLASS_FIELDS} FROM classes WHERE id = ?`, [req.params.id]);
      res.json(updatedClass);
    } else {
      res.status(404).json({ message: '班级不存在' });
    }
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ message: '班级名称已存在' });
    } else {
      res.status(500).json({ message: '更新班级失败', error: error.message });
    }
  }
};

// 删除班级
exports.deleteClass = async (req, res) => {
  try {
    const result = await run('DELETE FROM classes WHERE id = ?', [req.params.id]);
    if (result.changes > 0) {
      res.json({ message: '班级删除成功' });
    } else {
      res.status(404).json({ message: '班级不存在' });
    }
  } catch (error) {
    res.status(500).json({ message: '删除班级失败', error: error.message });
  }
};

// 获取班级下的学生列表
exports.getClassStudents = async (req, res) => {
  try {
    const classId = req.params.id;

    // 验证班级是否存在
    const cls = await getOne('SELECT id FROM classes WHERE id = ?', [classId]);
    if (!cls) {
      return res.status(404).json({ message: '班级不存在' });
    }

    const students = await query(
      `SELECT u.id, u.studentId, u.name, u.role, u.email, u.major, u.createdAt
       FROM users u
       JOIN user_classes uc ON u.id = uc.user_id
       WHERE uc.class_id = ?
       ORDER BY u.studentId`,
      [classId]
    );

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: '获取班级学生列表失败', error: error.message });
  }
};

// 批量设置班级学生（覆盖式：先删除旧关联，再插入新关联）
exports.setClassStudents = async (req, res) => {
  try {
    const classId = req.params.id;
    const { studentIds } = req.body; // 用户 id 数组

    if (!Array.isArray(studentIds)) {
      return res.status(400).json({ message: 'studentIds 必须是数组' });
    }

    // 验证班级是否存在
    const cls = await getOne('SELECT id FROM classes WHERE id = ?', [classId]);
    if (!cls) {
      return res.status(404).json({ message: '班级不存在' });
    }

    const db = getDb();

    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // 删除该班级所有旧关联
        db.run('DELETE FROM user_classes WHERE class_id = ?', [classId], (err) => {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }

          // 插入新关联
          if (studentIds.length > 0) {
            const stmt = db.prepare('INSERT OR IGNORE INTO user_classes (user_id, class_id) VALUES (?, ?)');
            let completed = 0;
            let hasError = false;

            for (const userId of studentIds) {
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
                if (completed === studentIds.length) {
                  stmt.finalize();
                  db.run('COMMIT', (commitErr) => {
                    if (commitErr) {
                      reject(commitErr);
                    } else {
                      resolve();
                    }
                  });
                }
              });
            }
          } else {
            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                reject(commitErr);
              } else {
                resolve();
              }
            });
          }
        });
      });
    });

    res.json({ message: '班级学生设置成功', count: studentIds.length });
  } catch (error) {
    res.status(500).json({ message: '设置班级学生失败', error: error.message });
  }
};

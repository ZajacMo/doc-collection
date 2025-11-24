// 作业控制器
const path = require('path');
const schedule = require('node-schedule');
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
        // 解析fileTypes字段
        const parsedRows = rows.map(row => {
          if (row.fileTypes) {
            try {
              row.fileTypes = JSON.parse(row.fileTypes);
            } catch (e) {
              console.error('解析fileTypes失败:', e);
              row.fileTypes = [];
            }
          }
          if (row.relativeStudents !== undefined && row.relativeStudents !== null) {
            try {
              row.relativeStudents = JSON.parse(row.relativeStudents);
            } catch (e) {
              row.relativeStudents = [];
            }
          }
          return row;
        });
        resolve(parsedRows);
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
 * 获取单个记录
 * @param {string} sql - SQL语句
 * @param {Array} params - 参数数组
 * @returns {Promise<Object|null>} 记录对象或null
 */
const getOne = async (sql, params = []) => {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
};

// 设置定期收集作业的任务
const setupCollectionSchedule = () => {
  // 根据配置的收集周期设置定时任务
  const cycle = process.env.COLLECTION_CYCLE || 'week';
  
  switch (cycle) {
    case 'day':
      // 每天凌晨2点执行
      schedule.scheduleJob('0 2 * * *', () => {
        console.log('执行每日作业收集任务');
        // 这里可以添加具体的收集逻辑
      });
      break;
    case 'week':
      // 每周日凌晨2点执行
      schedule.scheduleJob('0 2 * * 0', () => {
        console.log('执行每周作业收集任务');
        // 这里可以添加具体的收集逻辑
      });
      break;
    case 'month':
      // 每月1日凌晨2点执行
      schedule.scheduleJob('0 2 1 * *', () => {
        console.log('执行每月作业收集任务');
        // 这里可以添加具体的收集逻辑
      });
      break;
    default:
      console.log('无效的收集周期配置');
  }
};

// 启动定时任务
setupCollectionSchedule();

// 获取所有作业
exports.getAllAssignments = async (req, res) => {
  try {
    const assignments = await query('SELECT * FROM assignments ORDER BY createTime DESC');
    // 学生可见性过滤
    const user = req.user;
    if (user && user.role === 'student') {
      const sid = user.studentId;
      const filtered = assignments.filter(a => {
        const rs = Array.isArray(a.relativeStudents) ? a.relativeStudents : [];
        return rs.length === 0 || rs.includes(sid);
      });
      return res.json(filtered);
    }
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: '获取作业列表失败', error: error.message });
  }
};

// 获取单个作业及其提交记录
exports.getAssignmentById = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    // 检查作业是否存在
    const assignment = await getOne('SELECT * FROM assignments WHERE id = ?', [assignmentId]);
    if (!assignment) {
      return res.status(404).json({ message: '作业不存在' });
    }
    // 学生访问可见性校验
    const user = req.user;
    if (user && user.role === 'student') {
      const rs = Array.isArray(assignment.relativeStudents) ? assignment.relativeStudents : [];
      if (rs.length > 0 && !rs.includes(user.studentId)) {
        return res.status(403).json({ message: '无权访问该作业' });
      }
    }
    
    // 将作业信息和提交记录一起返回
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: '获取作业信息失败', error: error.message });
  }
};

// 创建作业
exports.createAssignment = async (req, res) => {
  try {
    // 获取最大ID
    const maxIdRow = await getOne('SELECT MAX(CAST(id AS INTEGER)) as maxId FROM assignments');
    const newId = (maxIdRow?.maxId || 0) + 1;
    
    const now = new Date().toISOString();
    const { title, description = '', deadline, fileTypes = ['pdf', 'doc', 'docx'], relativeStudents = [] } = req.body;

    // 确保relativeStudents列存在
    try {
      const db = getDb();
      await new Promise((resolve) => {
        db.run('ALTER TABLE assignments ADD COLUMN relativeStudents TEXT', () => resolve());
      });
    } catch (e) {
      // 列已存在时忽略错误
    }
    
    await run(
      `INSERT INTO assignments (id, title, description, deadline, createTime, updateTime, fileTypes, relativeStudents) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId.toString(),
        title,
        description,
        deadline,
        now,
        now,
        JSON.stringify(fileTypes),
        JSON.stringify(Array.isArray(relativeStudents) ? relativeStudents : [])
      ]
    );
    
    const newAssignment = {
      id: newId.toString(),
      title,
      description,
      deadline,
      createTime: now,
      updateTime: now,
      fileTypes,
      relativeStudents: Array.isArray(relativeStudents) ? relativeStudents : []
    };
    
    // 生成未提交记录（Unsubmitted）
    try {
      const db = getDb();
      db.run('BEGIN TRANSACTION');
      let targetStudentIds = [];
      if (Array.isArray(relativeStudents) && relativeStudents.length > 0) {
        targetStudentIds = relativeStudents;
      } else {
        const students = await query('SELECT studentId FROM users WHERE role = ?', ['student']);
        targetStudentIds = students.map(s => s.studentId);
      }
      // 获取当前最大ID一次
      const maxSubRow = await getOne('SELECT MAX(CAST(id AS INTEGER)) as maxId FROM submissions');
      let baseId = (maxSubRow?.maxId || 0);
      const submitTime = new Date().toISOString();
      for (const sid of targetStudentIds) {
        baseId += 1;
        await run(
          'INSERT INTO submissions (id, assignmentId, studentId, fileName, filePath, fileSize, submitTime, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            baseId.toString(),
            newId.toString(),
            sid,
            '',
            '',
            0,
            submitTime,
            'Unsubmitted'
          ]
        );
      }
      db.run('COMMIT');
    } catch (e) {
      try { getDb().run('ROLLBACK'); } catch {}
      // 不阻断创建作业流程，仅记录错误
      console.error('生成未提交记录失败:', e);
    }

    res.status(201).json(newAssignment);
  } catch (error) {
    res.status(500).json({ message: '创建作业失败', error: error.message });
  }
};

// 更新作业
exports.updateAssignment = async (req, res) => {
  try {
    const { title, description, deadline, fileTypes, relativeStudents } = req.body;
    const now = new Date().toISOString();
    
    // 构建更新字段
    const updates = [];
    const params = [];
    
    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (deadline !== undefined) {
      updates.push('deadline = ?');
      params.push(deadline);
    }
    // namingRule字段已移除
    if (fileTypes !== undefined) {
      updates.push('fileTypes = ?');
      params.push(JSON.stringify(fileTypes));
    }
    if (relativeStudents !== undefined) {
      // 确保relativeStudents列存在
      try {
        const db = getDb();
        await new Promise((resolve) => {
          db.run('ALTER TABLE assignments ADD COLUMN relativeStudents TEXT', () => resolve());
        });
      } catch {}
      updates.push('relativeStudents = ?');
      params.push(JSON.stringify(Array.isArray(relativeStudents) ? relativeStudents : []));
    }
    
    // 始终更新updateTime
    updates.push('updateTime = ?');
    params.push(now);
    
    // 添加ID参数
    params.push(req.params.id);
    
    const result = await run(
      `UPDATE assignments SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    if (result.changes > 0) {
      const updatedAssignment = await getOne('SELECT * FROM assignments WHERE id = ?', [req.params.id]);
      // 解析relativeStudents以便后续使用
      let targetStudents = [];
      try {
        const rs = relativeStudents !== undefined ? relativeStudents : updatedAssignment.relativeStudents;
        targetStudents = Array.isArray(rs) ? rs : JSON.parse(rs || '[]');
      } catch { targetStudents = []; }

      // 生成缺失的 Unsubmitted 提交记录（不影响主更新返回）
      try {
        const db = getDb();
        db.run('BEGIN TRANSACTION');
        // 计算目标学生集合
        if (!Array.isArray(targetStudents) || targetStudents.length === 0) {
          const students = await query('SELECT studentId FROM users WHERE role = ?', ['student']);
          targetStudents = students.map(s => s.studentId);
        }
        // 已存在的提交记录对应学生
        const existing = await query('SELECT studentId FROM submissions WHERE assignmentId = ?', [req.params.id]);
        const existingSet = new Set(existing.map(r => r.studentId));
        const toInsert = targetStudents.filter(sid => !existingSet.has(sid));
        if (toInsert.length > 0) {
          const maxSubRow = await getOne('SELECT MAX(CAST(id AS INTEGER)) as maxId FROM submissions');
          let baseId = (maxSubRow?.maxId || 0);
          for (const sid of toInsert) {
            baseId += 1;
            await run(
              'INSERT INTO submissions (id, assignmentId, studentId, fileName, filePath, fileSize, submitTime, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [
                baseId.toString(),
                req.params.id,
                sid,
                '',
                '',
                0,
                now,
                'Unsubmitted'
              ]
            );
          }
        }
        db.run('COMMIT');
      } catch (e) {
        try { getDb().run('ROLLBACK'); } catch {}
        // 仅记录错误，不影响主响应
        console.error('更新作业后生成未提交记录失败:', e);
      }
      res.json(updatedAssignment);
    } else {
      res.status(404).json({ message: '作业不存在' });
    }
  } catch (error) {
    res.status(500).json({ message: '更新作业失败', error: error.message });
  }
};

// 删除作业
exports.deleteAssignment = async (req, res) => {
  try {
    // 开启事务
    const db = getDb();
    db.run('BEGIN TRANSACTION');
    
    try {
      // 先删除相关的提交记录
      await run('DELETE FROM submissions WHERE assignmentId = ?', [req.params.id]);
      
      // 再删除作业
      const result = await run('DELETE FROM assignments WHERE id = ?', [req.params.id]);
      
      // 提交事务
      db.run('COMMIT');
      
      if (result.changes > 0) {
        res.json({ message: '作业已删除' });
      } else {
        res.status(404).json({ message: '作业不存在' });
      }
    } catch (error) {
      // 回滚事务
      db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    res.status(500).json({ message: '删除作业失败', error: error.message });
  }
};

// 获取作业的提交情况
exports.getAssignmentSubmissions = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    const submissions = await query(
      `SELECT 
         s.id,
         s.assignmentId,
         s.studentId,
         u.name AS studentName,
         s.fileName,
         s.filePath,
         s.fileSize,
         s.submitTime,
         s.status
       FROM submissions s
       LEFT JOIN users u ON s.studentId = u.studentId
       WHERE s.assignmentId = ?
       ORDER BY s.submitTime DESC`,
      [assignmentId]
    );
    
    res.json(submissions);
  } catch (error) {
    console.error('获取作业提交记录失败:', error);
    res.status(500).json({ message: '获取作业提交记录失败', error: error.message });
  }
};

// 查询作业提交情况
exports.getSubmissionStatus = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    // 检查作业是否存在
    const assignment = await getOne('SELECT * FROM assignments WHERE id = ?', [assignmentId]);
    if (!assignment) {
      return res.status(404).json({ message: '作业不存在' });
    }
    
    // 获取已提交的学生
    const submittedStudents = await query(
      `SELECT s.studentId, s.studentName, s.submitTime, s.fileInfo 
       FROM submissions s 
       WHERE s.assignmentId = ? 
       ORDER BY s.submitTime DESC`,
      [assignmentId]
    );
    
    // 获取所有学生（排除管理员）
    const students = await query(
      'SELECT id, name FROM users WHERE role = ?',
      ['student']
    );
    
    // 计算已提交和未提交人数
    const totalStudents = students.length;
    const submittedCount = submittedStudents.length;
    const unsubmittedCount = totalStudents - submittedCount;
    
    // 获取未提交的学生
    if (submittedCount > 0) {
      const submittedStudentIds = submittedStudents.map(s => s.studentId);
      const unsubmittedStudents = students
        .filter(s => !submittedStudentIds.includes(s.id))
        .map(s => ({
          studentId: s.id,
          studentName: s.name
        }));
      
      res.json({
        assignmentId,
        totalStudents,
        submittedCount,
        unsubmittedCount,
        submittedStudents,
        unsubmittedStudents
      });
    } else {
      // 如果没有已提交的，则所有学生都是未提交的
      const unsubmittedStudents = students.map(s => ({
        studentId: s.id,
        studentName: s.name
      }));
      
      res.json({
        assignmentId,
        totalStudents,
        submittedCount,
        unsubmittedCount,
        submittedStudents: [],
        unsubmittedStudents
      });
    }
  } catch (error) {
    res.status(500).json({ message: '获取提交情况失败', error: error.message });
  }
};

// 获取作业的学生总数
exports.getAssignmentUserCount=async(req,res)=>{
  try{
    const assignmentId = req.params.id;
    const userCount = await query(
      'SELECT COUNT(DISTINCT studentId) as count FROM submissions WHERE assignmentId = ?',
      [assignmentId]
    );
    res.json({
      assignmentId,
      userCount: userCount[0].count
    });
  } catch (error) {
    res.status(500).json({ message: '获取学生总数失败', error: error.message });
  }
};

// 获取作业的未提交用户
exports.getMissingSubmissions = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    // 检查作业是否存在
    const assignment = await getOne('SELECT * FROM assignments WHERE id = ?', [assignmentId]);
    if (!assignment) {
      return res.status(404).json({ message: '作业不存在' });
    }
    
    // 获取已提交的学生ID列表
    const submittedStudentIds = await query(
      'SELECT studentId FROM submissions WHERE assignmentId = ? and status = "submitted"',
      [assignmentId]
    ).then(rows => rows.map(row => row.studentId));
    
    // 构建查询：获取未提交的学生
    let queryStr = 'SELECT studentId as id, name FROM users WHERE role = ?';
    const params = ['student'];
    
    if (submittedStudentIds.length > 0) {
      queryStr += ' AND studentId NOT IN (' + submittedStudentIds.map(() => '?').join(', ') + ')';
      params.push(...submittedStudentIds);
    }
    
    queryStr += ' ORDER BY name';
    
    const missingStudents = await query(queryStr, params);
    // console.log('未提交学生:', missingStudents);
    
    res.json({
      assignmentId,
      assignmentTitle: assignment.title,
      deadline: assignment.deadline,
      missingCount: missingStudents.length,
      missingStudents: missingStudents.map(student => ({
        studentId: student.id,
        studentName: student.name
      }))
    });
  } catch (error) {
    res.status(500).json({ message: '获取未提交用户失败', error: error.message });
  }
};

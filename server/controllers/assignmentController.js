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
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: '获取作业列表失败', error: error.message });
  }
};

// 获取单个作业
exports.getAssignmentById = async (req, res) => {
  try {
    const assignment = await getOne('SELECT * FROM assignments WHERE id = ?', [req.params.id]);
    if (assignment) {
      res.json(assignment);
    } else {
      res.status(404).json({ message: '作业不存在' });
    }
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
    const { title, description = '', deadline, namingRule, fileTypes = ['pdf', 'doc', 'docx'] } = req.body;
    
    await run(
      `INSERT INTO assignments (id, title, description, deadline, createTime, updateTime, namingRule, fileTypes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      
      [
        newId.toString(),
        title,
        description,
        deadline,
        now,
        now,
        namingRule || process.env.FILE_NAMING_RULE || '{学号}_{姓名}_{作业名称}_{提交日期}',
        JSON.stringify(fileTypes)
      ]
    );
    
    const newAssignment = {
      id: newId.toString(),
      title,
      description,
      deadline,
      createTime: now,
      updateTime: now,
      namingRule: namingRule || process.env.FILE_NAMING_RULE || '{学号}_{姓名}_{作业名称}_{提交日期}',
      fileTypes
    };
    
    res.status(201).json(newAssignment);
  } catch (error) {
    res.status(500).json({ message: '创建作业失败', error: error.message });
  }
};

// 更新作业
exports.updateAssignment = async (req, res) => {
  try {
    const { title, description, deadline, namingRule, fileTypes } = req.body;
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
    if (namingRule !== undefined) {
      updates.push('namingRule = ?');
      params.push(namingRule);
    }
    if (fileTypes !== undefined) {
      updates.push('fileTypes = ?');
      params.push(JSON.stringify(fileTypes));
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
exports.getAssignmentSubmissions = (req, res) => {
  const assignmentSubmissions = submissions.filter(s => s.assignmentId === req.params.id);
  res.json(assignmentSubmissions);
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
      'SELECT studentId FROM submissions WHERE assignmentId = ?',
      [assignmentId]
    ).then(rows => rows.map(row => row.studentId));
    
    // 构建查询：获取未提交的学生
    let queryStr = 'SELECT id, name FROM users WHERE role = ?';
    const params = ['student'];
    
    if (submittedStudentIds.length > 0) {
      queryStr += ' AND id NOT IN (' + submittedStudentIds.map(() => '?').join(', ') + ')';
      params.push(...submittedStudentIds);
    }
    
    queryStr += ' ORDER BY name';
    
    const missingStudents = await query(queryStr, params);
    
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
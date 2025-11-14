// 提交控制器
const fs = require('fs');
const path = require('path');
const { getDb } = require('../db/db');

// 数据库操作辅助函数
// 执行查询并返回所有结果
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
};

// 执行查询并返回单个结果
const getOne = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
};

// 执行非查询操作（INSERT, UPDATE, DELETE）
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve({
        lastID: this.lastID,
        changes: this.changes
      });
    });
  });
};

// 文件相关的辅助函数已集成到各个方法中

// 获取所有提交
exports.getAllSubmissions = async (req, res) => {
  try {
    const allSubmissions = await query(
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
       ORDER BY s.submitTime DESC`,
      []
    );
    
    res.json(allSubmissions);
  } catch (error) {
    res.status(500).json({ message: '获取提交记录失败', error: error.message });
  }
};

// 获取单个提交
exports.getSubmissionById = async (req, res) => {
  try {
    const submission = await getOne(
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
       WHERE s.id = ?`,
      [req.params.id]
    );
    if (submission) {
      res.json(submission);
    } else {
      res.status(404).json({ message: '提交记录不存在' });
    }
  } catch (error) {
    res.status(500).json({ message: '获取提交记录失败', error: error.message });
  }
};

// 获取用户的所有提交
exports.getSubmissionsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const userSubmissions = await query(
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
       WHERE s.studentId = ?
       ORDER BY s.submitTime DESC`,
      [userId]
    );
    
    res.json(userSubmissions);
  } catch (error) {
    res.status(500).json({ message: '获取用户提交记录失败', error: error.message });
  }
};

// 创建新提交
exports.createSubmission = async (req, res) => {
  try {
    console.log('提交请求体:', req.body);
    
    // 尝试从不同位置获取参数
    const assignmentId = req.body?.assignmentId || req.fields?.assignmentId;
    const studentId = req.body?.studentId || req.fields?.studentId;
    const studentName = req.body?.studentName || req.fields?.studentName;
    const fileId = req.body?.fileId || req.fields?.fileId; // 支持上传的文件ID
    const fileName = req.body?.fileName || req.fields?.fileName;
    const filePath = req.body?.filePath || req.fields?.filePath;
    const fileSize = req.body?.fileSize || req.fields?.fileSize;
    
    console.log('解析后的数据:', { 
      assignmentId, 
      studentId, 
      studentName,
      fileId,
      fileName,
      filePath,
      fileSize
    });
      
    // 检查学生是否存在
    console.log('验证学生信息:', { studentId, type: typeof studentId });
    let studentExists;
    try {
      // 尝试不同类型的studentId查询（字符串和数字）
      studentExists = await getOne('SELECT id, name, studentId FROM users WHERE studentId = ?', [studentId]);
      
      // 如果直接查询失败，尝试转换为数字再查询
      if (!studentExists && !isNaN(studentId)) {
        const numericStudentId = Number(studentId);
        studentExists = await getOne('SELECT id, name, studentId FROM users WHERE studentId = ?', [numericStudentId]);
        console.log('数字转换后查询结果:', studentExists);
      }
    } catch (error) {
      console.error('学生查询数据库错误:', error);
    }
    
   
    // 检查作业是否存在
    const assignment = await getOne('SELECT id, title, deadline, fileTypes FROM assignments WHERE id = ?', [assignmentId]);
    if (!assignment) {
      return res.status(404).json({ message: '作业不存在' });
    }
    
  // 检查是否已过截止日期
  const deadline = new Date(assignment.deadline);
  const now = new Date();
  if (now > deadline) {
    return res.status(400).json({ message: '作业提交已截止' });
  }
  
  // 检查必要的文件信息
  if (!fileName || !filePath) {
    return res.status(400).json({ message: '缺少文件信息' });
  }

    // 校验文件类型（与上传保持一致的防线）
    try {
      const rawFileTypes = assignment.fileTypes || '[]';
      const allowedTypes = Array.isArray(rawFileTypes) ? rawFileTypes : JSON.parse(rawFileTypes);
      const ext = (fileName.split('.').pop() || '').toLowerCase();
      if (Array.isArray(allowedTypes) && allowedTypes.length > 0 && !allowedTypes.includes(ext)) {
        return res.status(400).json({ message: '不支持的文件类型' });
      }
    } catch {}
    
    // 检查用户是否已提交
    const existingSubmission = await getOne(
      'SELECT id, fileName, filePath, fileSize FROM submissions WHERE studentId = ? AND assignmentId = ?',
      [studentId, assignmentId]
    );
    
    const submitTime = new Date().toISOString();
    
    if (existingSubmission) {
      console.log('更新现有提交记录:', existingSubmission);

      const db = getDb();
      const oldPath = existingSubmission.filePath;
      const oldName = existingSubmission.fileName || '';
      const extOld = (oldName.split('.').pop() || (oldPath ? oldPath.split('.').pop() : '')).toLowerCase();
      const extNew = (fileName.split('.').pop() || '').toLowerCase();
      console.log('文件类型对比:', { extOld, extNew });

      try {
        db.run('BEGIN TRANSACTION');
        await run(
          'UPDATE submissions SET fileName = ?, filePath = ?, fileSize = ?, submitTime = ?, status = ? WHERE id = ?',
          [
            fileName,
            filePath,
            fileSize || 0,
            submitTime,
            'submitted',
            existingSubmission.id
          ]
        );

        // 仅在类型变化时删除旧文件
        const shouldDeleteOld = extOld && extNew && extOld !== extNew;
        if (shouldDeleteOld && oldPath) {
          try {
            const absoluteOldPath = path.isAbsolute(oldPath) ? oldPath : path.join(__dirname, '..', oldPath);
            fs.unlinkSync(absoluteOldPath);
          } catch (e) {
            db.run('ROLLBACK');
            try {
              const absoluteNewPath = path.isAbsolute(filePath) ? filePath : path.join(__dirname, '..', filePath);
              fs.unlinkSync(absoluteNewPath);
            } catch {}
            return res.status(500).json({ message: '替换旧文件失败' });
          }
        }

        db.run('COMMIT');
        const updatedSubmission = await getOne('SELECT * FROM submissions WHERE id = ?', [existingSubmission.id]);
        return res.json(updatedSubmission);
      } catch (e) {
        try { db.run('ROLLBACK'); } catch {}
        return res.status(500).json({ message: '提交更新失败' });
      }
    } else {
      console.log('创建新提交记录');
      // 获取最大ID
      const maxIdRow = await getOne('SELECT MAX(CAST(id AS INTEGER)) as maxId FROM submissions');
      const newId = (maxIdRow?.maxId || 0) + 1;
      
      // 创建新提交
      await run(
        'INSERT INTO submissions (id, assignmentId, studentId, fileName, filePath, fileSize, submitTime, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          newId.toString(),
          assignmentId,
          studentId,
          fileName,
          filePath,
          fileSize || 0,
          submitTime,
          'submitted'
        ]
      );
      
      const newSubmission = await getOne('SELECT * FROM submissions WHERE id = ?', [newId]);
      res.status(201).json(newSubmission);
    }
  } catch (error) {
    console.error('创建提交失败:', error);
    res.status(500).json({ message: '创建提交记录失败', error: error.message });
  }
};

// 更新提交
exports.updateSubmission = (req, res) => {
  const index = submissions.findIndex(s => s.id === req.params.id);
  if (index !== -1) {
    submissions[index] = {
      ...submissions[index],
      ...req.body,
      updateTime: new Date().toISOString()
    };
    saveData();
    res.json(submissions[index]);
  } else {
    res.status(404).json({ message: '提交不存在' });
  }
};

// 删除提交
exports.deleteSubmission = async (req, res) => {
  try {
    // 从数据库中删除记录
    const result = await run('DELETE FROM submissions WHERE id = ?', [req.params.id]);
    
    if (result.changes > 0) {
      res.json({ message: '提交已删除' });
    } else {
      res.status(404).json({ message: '提交不存在' });
    }
  } catch (error) {
    res.status(500).json({ message: '删除提交失败', error: error.message });
  }
};

// 下载提交的文件功能已移除，文件下载由uploadController处理

// 获取学生的作业提交状态
// 返回值："进行中"（还没逾期也没提交），"已逾期"，"已提交"（已提交未过期可修改），"已完结"（已提交已过期不可修改）
exports.getStudentSubmission = async (req, res) => {
  try {
    const { studentId, assignmentId } = req.params;
    
    // 检查参数
    if (!studentId || !assignmentId) {
      return res.status(400).json({ message: '缺少必要参数：studentId和assignmentId' });
    }
    
    // 获取作业信息
    const assignment = await getOne(
      'SELECT id, title, deadline FROM assignments WHERE id = ?',
      [assignmentId]
    );
    
    if (!assignment) {
      return res.status(404).json({ message: '作业不存在' });
    }
    
    // 检查作业截止时间
    const deadline = new Date(assignment.deadline);
    const now = new Date();
    const isExpired = now > deadline;
    const isUrgent = isExpired && (now - deadline) <= 24 * 60 * 60 * 1000; // 24小时内逾期
    const submission = await getOne(
      'SELECT id, fileName, fileSize, submitTime FROM submissions WHERE studentId = ? AND assignmentId = ?',
      [studentId, assignmentId]
    );
    let status = submission ? (isExpired ? "expired" : "submitted") : (isExpired ? "late" : isUrgent ? "urgent" : "in_progress");
    res.json({
      studentId,
      assignmentId,
      status,
      submissionInfo: submission? {...submission} : null
    });
  } catch (error) {
    console.error('获取学生提交状态失败:', error);
    res.status(500).json({ message: '获取学生提交状态失败', error: error.message });
  }
};

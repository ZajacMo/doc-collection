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
    // 从数据库查询所有提交记录，按提交时间降序排序
    const allSubmissions = await query(
      'SELECT * FROM submissions ORDER BY submitTime DESC',
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
    const submission = await getOne('SELECT * FROM submissions WHERE id = ?', [req.params.id]);
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
    
    // 从数据库查询用户的所有提交记录，按提交时间降序排序
    const userSubmissions = await query(
      'SELECT * FROM submissions WHERE studentId = ? ORDER BY submitTime DESC',
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
    // 检查文件是否上传
    if (!req.file) {
      return res.status(400).json({ message: '请上传文件' });
    }
    
    const { assignmentId, studentId, studentName, description = '' } = req.body;
    
    // 获取autoRename参数
    const autoRename = req.body.autoRename === 'true';
    
    // 检查学生和作业是否存在
    const studentExists = await getOne('SELECT id, name FROM users WHERE id = ? AND role = ?', [studentId, 'student']);
    if (!studentExists) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: '学生不存在' });
    }
    
    const assignment = await getOne('SELECT id, title, namingRule FROM assignments WHERE id = ?', [assignmentId]);
    if (!assignment) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: '作业不存在' });
    }
    
    // 检查是否已过截止日期
    const deadline = new Date(assignment.deadline);
    const now = new Date();
    if (now > deadline) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: '作业提交已截止' });
    }
    
    // 如果不使用自动重命名，则验证文件名格式
    if (!autoRename) {
      // 获取文件命名规则
      const namingRule = assignment.namingRule || process.env.FILE_NAMING_RULE || '{学号}_{姓名}_{作业名称}_{提交日期}';
      
      // 获取文件名（不包含扩展名）
      const baseName = path.basename(req.file.originalname, path.extname(req.file.originalname));
      const studentNameFromDB = studentExists.name;
      
      // 简单的验证逻辑
      if (!baseName.includes(studentId) || !baseName.includes(studentNameFromDB)) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
          valid: false, 
          message: `文件名不符合要求，请包含学号(${studentId})和姓名(${studentNameFromDB})` 
        });
      }
    }
    
    // 检查用户是否已提交
    const existingSubmission = await getOne(
      'SELECT id, filePath FROM submissions WHERE studentId = ? AND assignmentId = ?',
      [studentId, assignmentId]
    );
    
    const submitTime = new Date().toISOString();
    const filePath = req.file.path.replace(__dirname, '').replace(/^\\/, '');
    
    if (existingSubmission) {
      // 删除旧的提交文件
      try {
        if (existingSubmission.filePath && fs.existsSync(path.join(__dirname, existingSubmission.filePath))) {
          fs.unlinkSync(path.join(__dirname, existingSubmission.filePath));
        }
      } catch (err) {
        console.error('删除旧文件失败:', err);
      }
      
      // 更新提交
      await run(
        'UPDATE submissions SET fileName = ?, filePath = ?, fileSize = ?, description = ?, submitTime = ? WHERE id = ?',
        [
          req.file.originalname,
          filePath,
          req.file.size,
          description,
          submitTime,
          existingSubmission.id
        ]
      );
      
      const updatedSubmission = await getOne('SELECT * FROM submissions WHERE id = ?', [existingSubmission.id]);
      res.json(updatedSubmission);
    } else {
      // 获取最大ID
      const maxIdRow = await getOne('SELECT MAX(CAST(id AS INTEGER)) as maxId FROM submissions');
      const newId = (maxIdRow?.maxId || 0) + 1;
      
      // 创建新提交
      await run(
        'INSERT INTO submissions (id, assignmentId, studentId, studentName, fileName, filePath, fileSize, description, submitTime, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          newId.toString(),
          assignmentId,
          studentId,
          studentName || studentExists.name,
          req.file.originalname,
          filePath,
          req.file.size,
          description,
          submitTime,
          'submitted'
        ]
      );
      
      const newSubmission = await getOne('SELECT * FROM submissions WHERE id = ?', [newId]);
      res.status(201).json(newSubmission);
    }
  } catch (error) {
    // 错误处理：删除上传的文件
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('清理失败文件时出错:', err);
      }
    }
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
    // 获取提交记录
    const submission = await getOne('SELECT * FROM submissions WHERE id = ?', [req.params.id]);
    
    if (!submission) {
      return res.status(404).json({ message: '提交不存在' });
    }
    
    // 删除文件
    if (submission.filePath) {
      try {
        const fullPath = path.join(__dirname, submission.filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (err) {
        console.error('删除文件失败:', err);
        // 继续执行数据库删除，即使文件删除失败
      }
    }
    
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

// 下载提交的文件
exports.downloadSubmission = (req, res) => {
  const submission = submissions.find(s => s.id === req.params.id);
  if (submission && submission.filePath) {
    const filePath = path.join(__dirname, '../', submission.filePath);
    if (fs.existsSync(filePath)) {
      res.download(filePath, submission.fileName);
    } else {
      res.status(404).json({ message: '文件不存在' });
    }
  } else {
    res.status(404).json({ message: '提交不存在或文件已丢失' });
  }
};
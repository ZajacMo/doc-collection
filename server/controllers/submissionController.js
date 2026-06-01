// 提交控制器
const fs = require('fs');
const path = require('path');
const { getDb } = require('../db/db');

// 事务辅助函数：将 db.run 包装为 Promise
const tx = (sql) => new Promise((resolve, reject) => getDb().run(sql, (err) => err ? reject(err) : resolve()));

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

    // 支持直接文件上传（multipart 一步提交）或两步提交（body 中的文件信息）
    let fileName, filePath, fileSize;
    if (req.file) {
      // 一步提交：文件由 multer 直接处理
      fileName = req.file.filename;
      filePath = path.relative(path.join(__dirname, '..'), req.file.path);
      fileSize = req.file.size;
      console.log('直接从 multipart 获取文件:', { fileName, filePath, fileSize });
    } else {
      // 两步提交：文件信息在 body 中
      fileName = req.body?.fileName || req.fields?.fileName;
      filePath = req.body?.filePath || req.fields?.filePath;
      fileSize = req.body?.fileSize || req.fields?.fileSize;
    }

    console.log('解析后的数据:', {
      assignmentId,
      studentId,
      studentName,
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

    if (!studentExists) {
      return res.status(404).json({ message: '学生不存在' });
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
        await tx('BEGIN TRANSACTION');
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
            try { await tx('ROLLBACK'); } catch {}
            try {
              const absoluteNewPath = path.isAbsolute(filePath) ? filePath : path.join(__dirname, '..', filePath);
              fs.unlinkSync(absoluteNewPath);
            } catch {}
            return res.status(500).json({ message: '替换旧文件失败' });
          }
        }

        await tx('COMMIT');
        const updatedSubmission = await getOne('SELECT * FROM submissions WHERE id = ?', [existingSubmission.id]);
        return res.json(updatedSubmission);
      } catch (e) {
        try { await tx('ROLLBACK'); } catch {}
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
exports.updateSubmission = async (req, res) => {
  try {
    const { fileName, filePath, fileSize, status } = req.body;

    // 构建更新字段
    const updates = [];
    const params = [];

    if (fileName !== undefined) {
      updates.push('fileName = ?');
      params.push(fileName);
    }
    if (filePath !== undefined) {
      updates.push('filePath = ?');
      params.push(filePath);
    }
    if (fileSize !== undefined) {
      updates.push('fileSize = ?');
      params.push(fileSize);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: '没有要更新的字段' });
    }

    params.push(req.params.id);

    const result = await run(
      `UPDATE submissions SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.changes > 0) {
      const updatedSubmission = await getOne('SELECT * FROM submissions WHERE id = ?', [req.params.id]);
      res.json(updatedSubmission);
    } else {
      res.status(404).json({ message: '提交不存在' });
    }
  } catch (error) {
    res.status(500).json({ message: '更新提交失败', error: error.message });
  }
};

// 删除提交
exports.deleteSubmission = async (req, res) => {
  try {
    // 先查询获取文件路径
    const submission = await getOne('SELECT filePath FROM submissions WHERE id = ?', [req.params.id]);
    if (!submission) {
      return res.status(404).json({ message: '提交不存在' });
    }

    // 删除关联文件（如果存在）
    if (submission.filePath) {
      const absolutePath = path.isAbsolute(submission.filePath)
        ? submission.filePath
        : path.join(__dirname, '..', submission.filePath);
      try {
        fs.unlinkSync(absolutePath);
      } catch (e) {
        // 文件不存在或删除失败，仅记录日志，继续删除数据库记录
        console.error('删除文件失败:', e.message);
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
      'SELECT id, title, deadline FROM assignments WHERE id = ? ',
      [assignmentId]
    );

    if (!assignment) {
      return res.status(404).json({ message: '作业不存在' });
    }

    // 检查作业截止时间
    const deadline = new Date(assignment.deadline);
    const now = new Date();
    const isExpired = now > deadline;
    const hoursToDeadline = (deadline - now) / (60 * 60 * 1000);
    const isUrgent = !isExpired && hoursToDeadline > 0 && hoursToDeadline <= 24; // 截止前24小时内
    const submission = await getOne(
      'SELECT id, fileName, filePath, fileSize, submitTime FROM submissions WHERE studentId = ? AND assignmentId = ? AND status = "submitted"',
      [studentId, assignmentId]
    );
    let status;
    if (submission) {
      status = isExpired ? 'expired' : 'submitted';
    } else {
      if (isExpired) {
        status = 'late';
      } else if (isUrgent) {
        status = 'urgent';
      } else {
        status = 'in_progress';
      }
    }
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

// 下载单个提交的文件
exports.downloadSubmissionFile = async (req, res) => {
  try {
    const submissionId = req.params.id;

    // 获取提交记录
    const submission = await getOne(
      'SELECT fileName, filePath FROM submissions WHERE id = ?',
      [submissionId]
    );

    if (!submission) {
      return res.status(404).json({ message: '提交记录不存在' });
    }

    if (!submission.filePath) {
      return res.status(404).json({ message: '文件路径不存在' });
    }

    // 解析文件路径
    let filePath;
    if (path.isAbsolute(submission.filePath)) {
      filePath = submission.filePath;
    } else {
      filePath = path.join(__dirname, '..', submission.filePath);
    }

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: '文件不存在' });
    }

    // 设置响应头，支持中文文件名
    const encodedFileName = encodeURIComponent(submission.fileName);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`);

    // 发送文件
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (err) => {
      console.error('文件读取错误:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: '文件读取失败' });
      }
    });
  } catch (error) {
    console.error('下载提交文件失败:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: '下载文件失败', error: error.message });
    }
  }
};

// 下载所有提交的作业
exports.downloadAllSubmissions = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    // 获取作业信息
    const assignment = await getOne('SELECT * FROM assignments WHERE id = ?', [assignmentId]);
    if (!assignment) {
      return res.status(404).json({ message: '作业不存在' });
    }

    // 获取所有已提交的记录
    const submissions = await query(
      `SELECT s.*, u.name as studentName 
       FROM submissions s
       LEFT JOIN users u ON s.studentId = u.studentId
       WHERE s.assignmentId = ? AND LOWER(s.status) = 'submitted'`,
      [assignmentId]
    );

    if (submissions.length === 0) {
      return res.status(404).json({ message: '暂无提交记录' });
    }

    // 验证所有文件是否存在
    const missingFiles = [];
    const validFiles = [];
    
    for (const sub of submissions) {
      let filePath;
      // 检查路径是否包含 '/app' 前缀，如果包含则认为是绝对路径（Docker内）
      // 否则，如果是相对路径，则相对于服务器根目录解析
      if (path.isAbsolute(sub.filePath)) {
         filePath = sub.filePath;
      } else {
         filePath = path.join(__dirname, '..', sub.filePath);
      }
      
      if (fs.existsSync(filePath)) {
        validFiles.push({
          filePath,
          sub
        });
      } else {
        missingFiles.push({
          studentId: sub.studentId,
          studentName: sub.studentName,
          fileName: sub.fileName
        });
      }
    }
    
    // 如果有文件丢失，阻止下载并返回错误信息
    if (missingFiles.length > 0) {
      const errorMsg = `验证失败：数据库中有 ${submissions.length} 条记录，但只找到了 ${validFiles.length} 个文件。缺失文件详情：${missingFiles.map(f => `${f.studentName}(${f.studentId})`).join(', ')}`;
      console.error(errorMsg);
      return res.status(400).json({ 
        message: '文件完整性校验失败', 
        details: errorMsg,
        missingCount: missingFiles.length,
        totalCount: submissions.length
      });
    }

    const archiver = require('archiver');
    const archive = archiver('zip', {
      zlib: { level: 9 } // 最高压缩级别
    });

    // 设置响应头
    // 对文件名进行URL编码，防止中文乱码
    const filename = encodeURIComponent(`${assignment.title}.zip`);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);

    // 监听错误
    archive.on('error', function(err) {
      console.error('压缩出错:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: '压缩失败', error: err.message });
      }
      archive.destroy();
    });

    // 管道连接到响应
    archive.pipe(res);

    // 添加文件到压缩包
    for (const { filePath, sub } of validFiles) {
      // 使用学号-姓名-文件名格式，处理可能的重复文件名
      const ext = path.extname(sub.fileName);
      const baseName = path.basename(sub.fileName, ext);
      // 如果已经包含了学号和姓名，就不再重复添加
      let fileNameInZip = sub.fileName;
      if (!fileNameInZip.includes(sub.studentId)) {
           fileNameInZip = `${sub.studentId}-${sub.studentName}-${sub.fileName}`;
      }
      
      console.log(`添加文件到压缩包: ${fileNameInZip}`);
      archive.file(filePath, { name: fileNameInZip });
    }

    // 完成压缩
    await archive.finalize();

  } catch (error) {
    console.error('批量下载失败:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: '批量下载失败', error: error.message });
    }
  }
};

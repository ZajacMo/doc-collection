// 提交控制器
const fs = require('fs');
const path = require('path');

// 模拟数据库
let submissions = [];
let assignments = [];
let users = [];

// 从文件加载数据
const loadData = () => {
  try {
    const submissionsPath = path.join(__dirname, '../data/submissions.json');
    const assignmentsPath = path.join(__dirname, '../data/assignments.json');
    
    if (fs.existsSync(submissionsPath)) {
      submissions = JSON.parse(fs.readFileSync(submissionsPath, 'utf8'));
    }
    
    if (fs.existsSync(assignmentsPath)) {
      assignments = JSON.parse(fs.readFileSync(assignmentsPath, 'utf8'));
    }
    
    // 从userController获取用户数据
    const userController = require('./userController');
    userController.getAllUsers({}, { json: (data) => {
      users = data;
    }});
  } catch (error) {
    console.error('加载数据失败:', error);
  }
};

// 保存数据到文件
const saveData = () => {
  try {
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(dataDir, 'submissions.json'),
      JSON.stringify(submissions, null, 2),
      'utf8'
    );
  } catch (error) {
    console.error('保存数据失败:', error);
  }
};

// 初始化数据
loadData();

// 验证文件命名是否符合规则
const validateFileName = (fileName, studentId, assignmentId) => {
  try {
    // 获取作业信息
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) {
      return { valid: false, message: '作业不存在' };
    }
    
    // 获取用户信息
    const user = users.find(u => u.studentId === studentId);
    if (!user) {
      return { valid: false, message: '用户不存在' };
    }
    
    // 获取文件命名规则
    const namingRule = assignment.namingRule || process.env.FILE_NAMING_RULE;
    
    // 生成期望的文件名（不包含扩展名）
    const today = new Date();
    const dateStr = today.getFullYear() + 
                   String(today.getMonth() + 1).padStart(2, '0') + 
                   String(today.getDate()).padStart(2, '0');
    
    // 替换规则中的变量
    const expectedFileName = namingRule
      .replace('{学号}', studentId)
      .replace('{姓名}', user.name)
      .replace('{作业名称}', assignment.title)
      .replace('{提交日期}', dateStr);
    
    // 获取文件名（不包含扩展名）
    const baseName = path.basename(fileName, path.extname(fileName));
    
    // 简单的验证逻辑，实际应用中可能需要更复杂的正则匹配
    if (!baseName.includes(studentId) || !baseName.includes(user.name)) {
      return { 
        valid: false, 
        message: `文件名不符合要求，请按照格式命名：${namingRule}` 
      };
    }
    
    return { valid: true };
  } catch (error) {
    console.error('验证文件名失败:', error);
    return { valid: false, message: '验证文件名时发生错误' };
  }
};

// 获取所有提交
exports.getAllSubmissions = (req, res) => {
  res.json(submissions);
};

// 获取单个提交
exports.getSubmissionById = (req, res) => {
  const submission = submissions.find(s => s.id === req.params.id);
  if (submission) {
    res.json(submission);
  } else {
    res.status(404).json({ message: '提交不存在' });
  }
};

// 获取用户的提交
exports.getSubmissionsByUser = (req, res) => {
  const userSubmissions = submissions.filter(s => s.studentId === req.params.userId);
  res.json(userSubmissions);
};

// 创建提交
exports.createSubmission = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请上传文件' });
    }
    
    const { studentId, assignmentId, description } = req.body;
    
    // 验证文件命名
    const validation = validateFileName(req.file.originalname, studentId, assignmentId);
    if (!validation.valid) {
      // 删除上传的文件
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: validation.message });
    }
    
    // 检查作业是否存在
    const assignment = assignments.find(a => a.id === assignmentId);
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
    
    // 检查用户是否已提交
    const existingSubmission = submissions.find(
      s => s.studentId === studentId && s.assignmentId === assignmentId
    );
    
    if (existingSubmission) {
      // 删除旧的提交文件
      if (existingSubmission.filePath) {
        const oldFilePath = path.join(__dirname, '../', existingSubmission.filePath);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      
      // 更新提交
      existingSubmission.fileName = req.file.originalname;
      existingSubmission.filePath = req.file.path.replace(__dirname, '').replace(/^\\/, '');
      existingSubmission.fileSize = req.file.size;
      existingSubmission.description = description;
      existingSubmission.submitTime = new Date().toISOString();
      
      saveData();
      res.json(existingSubmission);
    } else {
      // 创建新提交
      const newSubmission = {
        id: (submissions.length + 1).toString(),
        studentId: studentId,
        assignmentId: assignmentId,
        fileName: req.file.originalname,
        filePath: req.file.path.replace(__dirname, '').replace(/^\\/, ''),
        fileSize: req.file.size,
        description: description,
        submitTime: new Date().toISOString(),
        status: 'submitted'
      };
      
      submissions.push(newSubmission);
      saveData();
      res.status(201).json(newSubmission);
    }
  } catch (error) {
    console.error('创建提交失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
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
exports.deleteSubmission = (req, res) => {
  const index = submissions.findIndex(s => s.id === req.params.id);
  if (index !== -1) {
    // 删除文件
    const submission = submissions[index];
    if (submission.filePath) {
      const filePath = path.join(__dirname, '../', submission.filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    submissions.splice(index, 1);
    saveData();
    res.json({ message: '提交已删除' });
  } else {
    res.status(404).json({ message: '提交不存在' });
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
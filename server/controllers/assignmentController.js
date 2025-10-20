// 作业控制器
const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');

// 模拟数据库
let assignments = [];
let submissions = [];

// 从文件加载数据
const loadData = () => {
  try {
    const assignmentsPath = path.join(__dirname, '../data/assignments.json');
    const submissionsPath = path.join(__dirname, '../data/submissions.json');
    
    if (fs.existsSync(assignmentsPath)) {
      assignments = JSON.parse(fs.readFileSync(assignmentsPath, 'utf8'));
    }
    
    if (fs.existsSync(submissionsPath)) {
      submissions = JSON.parse(fs.readFileSync(submissionsPath, 'utf8'));
    }
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
      path.join(dataDir, 'assignments.json'),
      JSON.stringify(assignments, null, 2),
      'utf8'
    );
    
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
exports.getAllAssignments = (req, res) => {
  res.json(assignments);
};

// 获取单个作业
exports.getAssignmentById = (req, res) => {
  const assignment = assignments.find(a => a.id === req.params.id);
  if (assignment) {
    res.json(assignment);
  } else {
    res.status(404).json({ message: '作业不存在' });
  }
};

// 创建作业
exports.createAssignment = (req, res) => {
  const newAssignment = {
    id: (assignments.length + 1).toString(),
    title: req.body.title,
    description: req.body.description,
    deadline: req.body.deadline,
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
    namingRule: req.body.namingRule || process.env.FILE_NAMING_RULE || '{学号}_{姓名}_{作业名称}_{提交日期}',
    fileTypes: req.body.fileTypes || ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar']
  };
  
  assignments.push(newAssignment);
  saveData();
  res.status(201).json(newAssignment);
};

// 更新作业
exports.updateAssignment = (req, res) => {
  const index = assignments.findIndex(a => a.id === req.params.id);
  if (index !== -1) {
    assignments[index] = {
      ...assignments[index],
      ...req.body,
      updateTime: new Date().toISOString()
    };
    saveData();
    res.json(assignments[index]);
  } else {
    res.status(404).json({ message: '作业不存在' });
  }
};

// 删除作业
exports.deleteAssignment = (req, res) => {
  const index = assignments.findIndex(a => a.id === req.params.id);
  if (index !== -1) {
    assignments.splice(index, 1);
    // 同时删除相关的提交
    submissions = submissions.filter(s => s.assignmentId !== req.params.id);
    saveData();
    res.json({ message: '作业已删除' });
  } else {
    res.status(404).json({ message: '作业不存在' });
  }
};

// 获取作业的提交情况
exports.getAssignmentSubmissions = (req, res) => {
  const assignmentSubmissions = submissions.filter(s => s.assignmentId === req.params.id);
  res.json(assignmentSubmissions);
};

// 获取作业的未提交用户
exports.getMissingSubmissions = (req, res) => {
  const userController = require('./userController');
  const assignment = assignments.find(a => a.id === req.params.id);
  
  if (!assignment) {
    return res.status(404).json({ message: '作业不存在' });
  }
  
  // 获取所有学生用户
  const allStudents = userController.getAllUsers({}, { json: (data) => {
    // 过滤出已经提交的学生ID
    const submittedStudentIds = submissions
      .filter(s => s.assignmentId === req.params.id)
      .map(s => s.studentId);
    
    // 找出未提交的学生
    const missingStudents = data.filter(student => 
      student.role === 'student' && !submittedStudentIds.includes(student.studentId)
    );
    
    res.json({
      assignmentId: req.params.id,
      assignmentTitle: assignment.title,
      deadline: assignment.deadline,
      missingCount: missingStudents.length,
      missingStudents: missingStudents
    });
  }});
};
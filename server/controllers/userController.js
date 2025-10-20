// 用户控制器
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// 模拟数据库
let users = [];

// 从Excel文件加载用户数据
const loadUsersFromExcel = () => {
  try {
    const excelPath = path.join(__dirname, '../../名单.xls');
    
    // 始终先创建默认用户，确保admin用户可用
    let defaultUsers = [
      { id: '1', studentId: 'admin', name: '管理员', role: 'admin' },
      { id: '2', studentId: '2023001', name: '张三', role: 'student' },
      { id: '3', studentId: '2023002', name: '李四', role: 'student' },
      { id: '4', studentId: '2023003', name: '王五', role: 'student' }
    ];
    
    if (fs.existsSync(excelPath)) {
      const workbook = XLSX.readFile(excelPath);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      // 处理数据，假设Excel中有学号、姓名等字段
      const excelUsers = data.map((row, index) => ({
        id: (defaultUsers.length + index + 1).toString(),
        studentId: row['学号'] || `student${defaultUsers.length + index + 1}`,
        name: row['姓名'] || `User${defaultUsers.length + index + 1}`,
        // 其他可能的字段
        className: row['班级'] || '',
        major: row['专业'] || '',
        email: row['邮箱'] || '',
        role: 'student' // 默认角色为学生
      }));
      
      // 合并默认用户和Excel用户
      users = [...defaultUsers, ...excelUsers];
      console.log(`成功从Excel加载了 ${excelUsers.length} 个用户数据，加上默认的 ${defaultUsers.length} 个用户，总共 ${users.length} 个用户`);
    } else {
      console.log('Excel文件不存在，使用默认用户数据');
      users = defaultUsers;
    }
  } catch (error) {
    console.error('加载Excel文件失败:', error);
    // 使用默认用户
    users = [
      { id: '1', studentId: 'admin', name: '管理员', role: 'admin' },
      { id: '2', studentId: '2023001', name: '张三', role: 'student' },
      { id: '3', studentId: '2023002', name: '李四', role: 'student' },
      { id: '4', studentId: '2023003', name: '王五', role: 'student' }
    ];
  }
};

// 初始化加载用户数据
loadUsersFromExcel();

// 获取所有用户
exports.getAllUsers = (req, res) => {
  res.json(users);
};

// 获取单个用户
exports.getUserById = (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: '用户不存在' });
  }
};

// 创建用户
exports.createUser = (req, res) => {
  const newUser = {
    id: (users.length + 1).toString(),
    ...req.body,
    role: req.body.role || 'student'
  };
  users.push(newUser);
  res.status(201).json(newUser);
};

// 更新用户
exports.updateUser = (req, res) => {
  const index = users.findIndex(u => u.id === req.params.id);
  if (index !== -1) {
    users[index] = { ...users[index], ...req.body };
    res.json(users[index]);
  } else {
    res.status(404).json({ message: '用户不存在' });
  }
};

// 删除用户
exports.deleteUser = (req, res) => {
  const index = users.findIndex(u => u.id === req.params.id);
  if (index !== -1) {
    users.splice(index, 1);
    res.json({ message: '用户已删除' });
  } else {
    res.status(404).json({ message: '用户不存在' });
  }
};

// 用户登录
exports.loginUser = (req, res) => {
  const { studentId, password } = req.body;
  // 简化的登录逻辑，实际应用中应该使用密码哈希
  const user = users.find(u => u.studentId === studentId);
  
  if (user) {
    // 这里假设所有用户的默认密码都是123456
    if (password === '123456') {
      res.json({
        id: user.id,
        studentId: user.studentId,
        name: user.name,
        role: user.role,
        token: `mock-token-${user.id}` // 模拟JWT token
      });
    } else {
      res.status(401).json({ message: '密码错误' });
    }
  } else {
    res.status(401).json({ message: '用户不存在' });
  }
};
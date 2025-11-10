// 上传控制器
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// 配置存储 - 确保目录存在
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// 通用存储配置 - 支持上传到作业名称子目录
const createStorage = (baseDestinationPath) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        // 从请求体中获取作业名称
        const { assignmentName } = req.body;
        
        // 验证作业名称参数的有效性
        if (!assignmentName || typeof assignmentName !== 'string' || assignmentName.trim() === '') {
          return cb(new Error('缺少必需的作业名称参数'), null);
        }
        
        // 清理作业名称中的非法字符
        const safeAssignmentName = assignmentName.replace(/[\\/:*?"<>|]/g, '_');
        
        // 构建完整路径：基础路径/作业名称
        const fullPath = path.join(__dirname, '..', baseDestinationPath, safeAssignmentName);
        
        // 确保目录存在
        ensureDir(fullPath);
        
        // 返回目标目录
        cb(null, fullPath);
      } catch (error) {
        cb(new Error(`创建上传目录失败: ${error.message}`), null);
      }
    },
    filename: (req, file, cb) => {
      // 从请求体中获取学生姓名和学号
      const studentName = req.body.studentName || '未知姓名';
      const studentId = req.body.studentId || '未知学号';
      
      // 获取文件扩展名
      const fileExtension = path.extname(file.originalname);
      
      // 重命名文件为"姓名-学号"格式，添加扩展名
      const newFileName = `${studentName}-${studentId}${fileExtension}`;
      
      cb(null, newFileName);
    }
  });
};

// 创建上传实例
const regularUpload = multer({ 
  storage: createStorage('uploads'),
  limits: { fileSize: 10 * 1024 * 1024 } // 限制文件大小为10MB
});

// 普通文件上传
router.post('/', regularUpload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '没有文件被上传' });
  }
  
  // 获取重命名后的文件名
  const renamedFileName = req.file.filename;
  
  res.json({
    id: Date.now().toString(),
    fileName: renamedFileName,
    filePath: req.file.path.replace(__dirname, '').replace(/^\\/, ''),
    size: req.file.size
  });
});

module.exports = router;
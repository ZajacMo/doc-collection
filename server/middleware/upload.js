// 文件上传中间件
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 配置存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 根据作业名称创建存储目录
    const { assignmentName } = req.body;
    let uploadPath = process.env.UPLOAD_DIR || './server/uploads';
    
    if (assignmentName) {
      // 清理作业名称中的非法字符，确保可以作为文件夹名
      const safeAssignmentName = assignmentName.replace(/[\\/:*?"<>|]/g, '_');
      uploadPath = path.join(uploadPath, safeAssignmentName);
    }
    
    // 确保目录存在
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const { studentId, studentName, autoRename } = req.body;
    const ext = path.extname(file.originalname);
    
    if (autoRename && studentId && studentName) {
      // 自动命名为"学号-姓名.扩展名"
      const newFileName = `${studentId}-${studentName}${ext}`;
      cb(null, newFileName);
    } else {
      // 使用原始文件名，但添加时间戳以避免覆盖
      const timestamp = Date.now();
      const baseName = path.basename(file.originalname, ext);
      cb(null, `${baseName}_${timestamp}${ext}`);
    }
  }
});

// 文件过滤
const fileFilter = (req, file, cb) => {
  // 获取允许的文件类型
  const allowedTypes = req.body.fileTypes || [
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', 'jpg', 'jpeg', 'png'
  ];
  
  const ext = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型。允许的类型：${allowedTypes.join(', ')}`), false);
  }
};

// 创建upload实例
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 默认10MB
  },
  fileFilter: fileFilter
});

// 处理multer错误的中间件
exports.handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer错误
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: '文件大小超过限制' });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    // 其他错误
    return res.status(400).json({ message: err.message });
  }
  next();
};

module.exports = upload;
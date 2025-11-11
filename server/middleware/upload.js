// 文件上传中间件 - 确保文件始终上传到作业名称子目录下
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 配置存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      // 从请求体中获取作业名称
      const { assignmentName } = req.body;
      
      // 获取基础上传目录，支持环境变量配置或使用默认值
      let baseUploadPath = process.env.UPLOAD_DIR || './server/uploads';
      
      // 验证作业名称参数的有效性 - 必须提供作业名称
      if (!assignmentName || typeof assignmentName !== 'string' || assignmentName.trim() === '') {
        return cb(new Error('缺少必需的作业名称参数'), null);
      }
      
      // 清理作业名称中的非法字符，确保可以作为文件夹名
      const safeAssignmentName = assignmentName.replace(/[\\/:*?"<>|]/g, '_');
      
      // 构建完整的上传路径：基础路径/作业名称
      // 确保文件始终上传到作业名称子目录中，而不是直接在uploads根目录下
      const fullUploadPath = path.join(baseUploadPath, safeAssignmentName);
      
      // 确保目标目录存在，使用recursive选项自动创建多级目录
      fs.mkdirSync(fullUploadPath, { recursive: true });
      
      // 返回构建好的目录路径
      cb(null, fullUploadPath);
    } catch (error) {
      // 捕获并处理任何可能的错误
      cb(new Error(`创建上传目录失败: ${error.message}`), null);
    }
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
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 默认100MB
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
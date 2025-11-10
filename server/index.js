// 服务器入口文件
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// 数据库连接模块
const { initDatabase } = require('./db/db');

// 创建Express应用
const app = express();

// 设置端口
const PORT = 3001; // 直接设置端口为3001，避免环境变量配置问题

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 用于提供文件下载
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

    // 确保必要目录存在
    const directories = ['uploads'];
    directories.forEach(dir => {
      const dirPath = path.join(__dirname, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`创建${dir}目录成功`);
      }
    });

// 初始化数据库连接
async function startServer() {
  try {
    // 初始化数据库
    await initDatabase();
    console.log('数据库初始化完成');
    
    // 路由
    const userRoutes = require('./routes/users');
    const assignmentRoutes = require('./routes/assignments');
    const submissionRoutes = require('./routes/submissions');
    const uploadRoutes = require('./controllers/uploadController'); // 直接使用上传控制器作为路由
    
    app.use('/api/users', userRoutes);
    app.use('/api/assignments', assignmentRoutes);
    app.use('/api/submissions', submissionRoutes);
    app.use('/api/upload', uploadRoutes); // 添加文件上传路由
    
    // 健康检查接口
    app.get('/api/health', (req, res) => {
      res.json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });
    
    // 根路由
    app.get('/', (req, res) => {
      res.send('作业收集系统服务器运行中');
    });
    
    // 404路由
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: '未找到该资源'
      });
    });
    
    // 错误处理中间件
    app.use((err, req, res, next) => {
      console.error('错误:', err);
      
      // 文件上传错误处理
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: '文件大小超过限制'
        });
      }
      
      // 文件类型错误处理
      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          success: false,
          message: '不支持的文件类型'
        });
      }
      
      // 通用错误处理
      res.status(500).json({
        success: false,
        message: err.message || '服务器内部错误'
      });
    })
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
      console.log('API接口列表:');
      console.log('  GET    /api/health             - 健康检查');
      console.log('  POST   /api/users/login        - 用户登录');
      console.log('  GET    /api/users              - 获取所有用户 (管理员)');
      console.log('  GET    /api/users/:id          - 获取单个用户');
      console.log('  POST   /api/users              - 创建用户 (管理员)');
      console.log('  PUT    /api/users/:id          - 更新用户 (管理员)');
      console.log('  DELETE /api/users/:id          - 删除用户 (管理员)');
      console.log('  POST   /api/users/import       - 导入用户 (管理员)');
      console.log('  GET    /api/assignments        - 获取所有作业');
      console.log('  GET    /api/assignments/:id    - 获取单个作业');
      console.log('  POST   /api/assignments        - 创建作业 (管理员)');
      console.log('  PUT    /api/assignments/:id    - 更新作业 (管理员)');
      console.log('  DELETE /api/assignments/:id    - 删除作业 (管理员)');
      console.log('  GET    /api/assignments/:id/submissions - 获取作业提交情况');
      console.log('  GET    /api/assignments/:id/unsubmitted - 获取未提交用户');
      console.log('  GET    /api/submissions        - 获取所有提交 (管理员)');
      console.log('  GET    /api/submissions/:id    - 获取单个提交');
      console.log('  GET    /api/submissions/user/:userId - 获取用户提交');
      console.log('  POST   /api/submissions        - 提交作业');
      console.log('  PUT    /api/submissions/:id    - 更新提交');
      console.log('  DELETE /api/submissions/:id    - 删除提交');
      console.log('  GET    /api/submissions/:id/download - 下载文件');
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();

// 导出app供测试使用
module.exports = app;
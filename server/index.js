// 服务器入口文件
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');

// 数据库连接模块
const { initDatabase, closeDb, ensureSchema, initRbacSchema } = require(process.env.DB_PATH || './db/db');

// 创建Express应用
const app = express();

// 设置端口
const PORT = Number(process.env.PORT) || 3001;
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

// 自动获取本机所有非回环 IPv4 地址（局域网/公网）
function getLocalIPs() {
  const ips = new Set();
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.add(`http://${iface.address}`);
        ips.add(`http://${iface.address}:5173`);
      }
    }
  }
  return Array.from(ips);
}
const autoIPs = getLocalIPs();

// 中间件配置
const defaultOrigins = ['http://localhost:5173', 'http://localhost', 'http://localhost:80', 'http://127.0.0.1', 'http://127.0.0.1:5173'];
const envOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
const allowedOrigins = [...new Set([...defaultOrigins, ...autoIPs, ...envOrigins])];

if (autoIPs.length) {
  console.log('自动检测到的本机 IP（已加入 CORS 白名单）:');
  autoIPs.forEach(ip => console.log(`  - ${ip}`));
}
app.use(cors({
  // origin: true 动态反射请求的 Origin，支持任意 IP/域名访问
  // 配合 Nginx 反向代理使用，安全性由网络边界保证
  origin: true,
  credentials: true
}));
// 增加请求体大小限制为20MB，与MAX_FILE_SIZE保持一致
const jsonLimit = process.env.MAX_FILE_SIZE ? `${parseInt(process.env.MAX_FILE_SIZE)}b` : '20mb';
app.use(express.json({ limit: jsonLimit }));
app.use(express.urlencoded({ extended: true, limit: jsonLimit }));

// 静态文件服务 - 用于提供文件下载
    app.use('/uploads', express.static(path.join(__dirname, UPLOAD_DIR)));

    // 确保必要目录存在
    const directories = [UPLOAD_DIR];
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

    // 确保数据库 schema 是最新的
    await ensureSchema();
    console.log('数据库 schema 检查完成');

    // 初始化 RBAC 表结构和默认数据
    await initRbacSchema();
    console.log('RBAC 初始化完成');

    // 鉴权中间件：验证 JWT 并注入 req.user
    const jwt = require('jsonwebtoken');
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET 环境变量未配置，请在 .env 文件中设置');
    }
    const { loadUserPermissions } = require('./middleware/auth');
    app.use(async (req, res, next) => {
      try {
        const auth = req.headers.authorization || '';
        const token = auth.startsWith('Bearer ') ? auth.substring(7) : '';
        if (!token) return next();
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
        next();
      } catch (err) {
        // Token 无效或过期时返回 401，不再静默通过
        return res.status(401).json({ message: '登录已过期或无效，请重新登录' });
      }
    });

    // 加载用户权限到 req.user.permissions
    app.use(loadUserPermissions);

    // 路由
    const userRoutes = require('./routes/users');
    const assignmentRoutes = require('./routes/assignments');
    const submissionRoutes = require('./routes/submissions');
    const roleRoutes = require('./routes/roles');
    const permissionRoutes = require('./routes/permissions');
    const uploadRoutes = require('./controllers/uploadController'); // 直接使用上传控制器作为路由

    app.use('/api/users', userRoutes);
    app.use('/api/assignments', assignmentRoutes);
    app.use('/api/submissions', submissionRoutes);
    app.use('/api/roles', roleRoutes);
    app.use('/api/permissions', permissionRoutes);
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
    const server = app.listen(PORT, () => {
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
    console.log('  GET    /api/roles                 - 获取所有角色');
    console.log('  GET    /api/roles/:id             - 获取单个角色');
    console.log('  POST   /api/roles                 - 创建角色');
    console.log('  PUT    /api/roles/:id             - 更新角色');
    console.log('  DELETE /api/roles/:id             - 删除角色');
    console.log('  GET    /api/permissions           - 获取所有权限');
    console.log('  GET    /api/permissions/me        - 获取当前用户权限');
    });

    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        console.error(`端口已被占用: ${PORT}`);
        process.exit(1);
      }
    });

    const shutdown = () => {
      server.close(() => {
        try { closeDb(); } catch {}
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();

// 导出app供测试使用
module.exports = app;

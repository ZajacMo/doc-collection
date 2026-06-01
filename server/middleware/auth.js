// 认证和授权中间件

// 要求已登录
exports.requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: '未登录或登录已过期' });
  }
  next();
};

// 要求管理员权限
exports.requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: '未登录或登录已过期' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: '需要管理员权限' });
  }
  next();
};

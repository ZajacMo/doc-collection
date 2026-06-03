// 认证和授权中间件
const { getRolePermissions } = require('../db/db');

// 要求已登录
exports.requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: '未登录或登录已过期' });
  }
  next();
};

// 要求管理员权限（兼容旧逻辑：admin 或 super_admin 均可）
exports.requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: '未登录或登录已过期' });
  }
  const allowedRoles = ['admin', 'super_admin'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: '需要管理员权限' });
  }
  next();
};

// 要求超级管理员权限
exports.requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: '未登录或登录已过期' });
  }
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: '需要超级管理员权限' });
  }
  next();
};

// 要求指定权限（支持单个权限字符串或权限数组，满足其一即可）
exports.requirePermission = (permissions) => {
  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: '未登录或登录已过期' });
    }

    // super_admin 拥有所有权限，直接放行
    if (req.user.role === 'super_admin') {
      return next();
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = requiredPermissions.some(p => userPermissions.includes(p));

    if (!hasPermission) {
      return res.status(403).json({ message: '权限不足' });
    }
    next();
  };
};

/**
 * 加载用户权限到 req.user.permissions
 * 在 JWT 认证中间件之后调用
 */
exports.loadUserPermissions = async (req, res, next) => {
  if (!req.user || !req.user.role) {
    return next();
  }

  try {
    const permissions = await getRolePermissions(req.user.role);
    req.user.permissions = permissions;
    next();
  } catch (err) {
    console.error('加载用户权限失败:', err);
    req.user.permissions = [];
    next();
  }
};

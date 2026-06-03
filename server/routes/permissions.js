// 权限路由
const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middleware/auth');
const permissionController = require('../controllers/permissionController');

// 获取所有权限（需要权限查看权限）
router.get('/', requireAuth, requirePermission('permission:read'), permissionController.getAllPermissions);

// 获取当前用户权限（已登录即可）
router.get('/me', requireAuth, permissionController.getMyPermissions);

module.exports = router;

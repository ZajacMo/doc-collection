// 用户路由
const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const userController = require('../controllers/userController');

// 获取所有用户（仅管理员）
router.get('/', requireAdmin, userController.getAllUsers);

// 用户登录（公开）
router.post('/login', userController.loginUser);

// 获取单个用户（需要登录）
router.get('/:id', requireAuth, userController.getUserById);

// 创建用户（仅管理员）
router.post('/', requireAdmin, userController.createUser);

// 更新用户（仅管理员）
router.put('/:id', requireAdmin, userController.updateUser);

// 删除用户（仅管理员）
router.delete('/:id', requireAdmin, userController.deleteUser);

// 批量创建用户（仅管理员）
router.post('/batch', requireAdmin, userController.batchCreateUsers);

// 修改密码（已登录用户可修改自己的密码，管理员可修改任意用户密码）
router.post('/:id/change-password', requireAuth, userController.changePassword);

// 重置密码（仅管理员）
router.post('/:id/reset-password', requireAdmin, userController.resetPassword);

module.exports = router;

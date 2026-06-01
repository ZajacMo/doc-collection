// 用户路由
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// 获取所有用户
router.get('/', userController.getAllUsers);

// 用户登录
router.post('/login', userController.loginUser);

// 获取单个用户
router.get('/:id', userController.getUserById);

// 创建用户
router.post('/', userController.createUser);

// 更新用户
router.put('/:id', userController.updateUser);

// 删除用户
router.delete('/:id', userController.deleteUser);

// 批量创建用户
router.post('/batch', userController.batchCreateUsers);

// 修改密码
router.post('/:id/change-password', userController.changePassword);

// 重置密码（管理员）
router.post('/:id/reset-password', userController.resetPassword);

module.exports = router;
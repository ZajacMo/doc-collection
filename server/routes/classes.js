// 班级路由
const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const classController = require('../controllers/classController');

// 获取所有班级（需要登录）
router.get('/', requireAuth, classController.getAllClasses);

// 获取单个班级（需要登录）
router.get('/:id', requireAuth, classController.getClassById);

// 创建班级（仅管理员）
router.post('/', requireAdmin, classController.createClass);

// 更新班级（仅管理员）
router.put('/:id', requireAdmin, classController.updateClass);

// 删除班级（仅管理员）
router.delete('/:id', requireAdmin, classController.deleteClass);

// 获取班级学生列表（需要登录）
router.get('/:id/students', requireAuth, classController.getClassStudents);

// 设置班级学生（仅管理员）
router.post('/:id/students', requireAdmin, classController.setClassStudents);

module.exports = router;

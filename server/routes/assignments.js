// 作业路由
const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const assignmentController = require('../controllers/assignmentController');

// 获取所有作业（需要登录，学生只能看到可见作业）
router.get('/', requireAuth, assignmentController.getAllAssignments);

// 获取单个作业（需要登录）
router.get('/:id', requireAuth, assignmentController.getAssignmentById);

// 创建作业（仅管理员）
router.post('/', requireAdmin, assignmentController.createAssignment);

// 更新作业（仅管理员）
router.put('/:id', requireAdmin, assignmentController.updateAssignment);

// 删除作业（仅管理员）
router.delete('/:id', requireAdmin, assignmentController.deleteAssignment);

// 获取作业的提交情况（需要登录）
router.get('/:id/submissions', requireAuth, assignmentController.getAssignmentSubmissions);

// 获取作业的学生总数（需要登录）
router.get('/:id/userCount', requireAuth, assignmentController.getAssignmentUserCount);

// 获取作业的未提交用户（需要登录）
router.get('/:id/missing', requireAuth, assignmentController.getMissingSubmissions);

// 下载所有提交的作业（需要登录）
const submissionController = require('../controllers/submissionController');
router.get('/:id/download-all', requireAuth, submissionController.downloadAllSubmissions);

module.exports = router;

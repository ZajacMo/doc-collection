// 提交路由
const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const submissionController = require('../controllers/submissionController');
const upload = require('../middleware/upload');

// 获取所有提交（仅管理员）
router.get('/', requireAdmin, submissionController.getAllSubmissions);

// 获取单个提交（需要登录）
router.get('/:id', requireAuth, submissionController.getSubmissionById);

// 获取用户的提交（需要登录）
router.get('/user/:userId', requireAuth, submissionController.getSubmissionsByUser);

// 上传作业文件（需要登录）
router.post('/', requireAuth, upload.single('file'), submissionController.createSubmission);

// 更新提交（需要登录）
router.put('/:id', requireAuth, submissionController.updateSubmission);

// 删除提交（仅管理员）
router.delete('/:id', requireAdmin, submissionController.deleteSubmission);

// 获取学生的作业提交状态（需要登录）
router.get('/status/:studentId/:assignmentId', requireAuth, submissionController.getStudentSubmission);

// 下载提交的文件路由已移除，文件下载由uploadController处理

module.exports = router;

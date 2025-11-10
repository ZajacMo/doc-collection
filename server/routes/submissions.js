// 提交路由
const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const upload = require('../middleware/upload');

// 获取所有提交
router.get('/', submissionController.getAllSubmissions);

// 获取单个提交
router.get('/:id', submissionController.getSubmissionById);

// 获取用户的提交
router.get('/user/:userId', submissionController.getSubmissionsByUser);

// 上传作业文件
router.post('/', upload.single('file'), submissionController.createSubmission);

// 更新提交
router.put('/:id', submissionController.updateSubmission);

// 删除提交
router.delete('/:id', submissionController.deleteSubmission);

// 获取学生的作业提交状态
router.get('/status/:studentId/:assignmentId', submissionController.getStudentSubmissionStatus);

// 下载提交的文件路由已移除，文件下载由uploadController处理

module.exports = router;
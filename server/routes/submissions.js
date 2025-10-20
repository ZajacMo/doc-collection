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

// 下载提交的文件
router.get('/:id/download', submissionController.downloadSubmission);

module.exports = router;
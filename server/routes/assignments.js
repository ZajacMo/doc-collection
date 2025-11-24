// 作业路由
const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');

// 获取所有作业
router.get('/', assignmentController.getAllAssignments);

// 获取单个作业
router.get('/:id', assignmentController.getAssignmentById);

// 创建作业
router.post('/', assignmentController.createAssignment);

// 更新作业
router.put('/:id', assignmentController.updateAssignment);

// 删除作业
router.delete('/:id', assignmentController.deleteAssignment);

// 获取作业的提交情况
router.get('/:id/submissions', assignmentController.getAssignmentSubmissions);

// 获取作业的学生总数
router.get('/:id/userCount', assignmentController.getAssignmentUserCount);

// 获取作业的未提交用户
router.get('/:id/missing', assignmentController.getMissingSubmissions);

module.exports = router;
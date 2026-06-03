// 角色路由
const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middleware/auth');
const roleController = require('../controllers/roleController');

// 获取所有角色（需要角色查看权限）
router.get('/', requireAuth, requirePermission('role:read'), roleController.getAllRoles);

// 获取单个角色（需要角色查看权限）
router.get('/:id', requireAuth, requirePermission('role:read'), roleController.getRoleById);

// 创建角色（需要角色创建权限）
router.post('/', requireAuth, requirePermission('role:create'), roleController.createRole);

// 更新角色（需要角色编辑权限）
router.put('/:id', requireAuth, requirePermission('role:update'), roleController.updateRole);

// 删除角色（需要角色删除权限）
router.delete('/:id', requireAuth, requirePermission('role:delete'), roleController.deleteRole);

module.exports = router;

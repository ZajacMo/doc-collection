<template>
  <div class="role-management">
    <div class="role-actions">
      <el-button type="primary" @click="showCreateDialog">创建角色</el-button>
    </div>

    <el-table :data="roles" stripe border style="width: 100%">
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="name" label="角色名称" width="120" />
      <el-table-column prop="code" label="角色代码" width="120" />
      <el-table-column prop="description" label="描述" min-width="200" />
      <el-table-column label="系统内置" width="100">
        <template #default="{ row }">
          <el-tag :type="row.is_system ? 'success' : 'info'" size="small">
            {{ row.is_system ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="权限" min-width="300">
        <template #default="{ row }">
          <el-space wrap>
            <el-tag
              v-for="perm in row.permissions"
              :key="perm.id"
              size="small"
              :type="perm.module === 'role' || perm.module === 'permission' ? 'warning' : 'primary'"
            >
              {{ perm.name }}
            </el-tag>
          </el-space>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="showEditDialog(row)">编辑</el-button>
          <el-button
            v-if="!row.is_system"
            type="danger"
            size="small"
            @click="handleDeleteRole(row)"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 创建/编辑角色对话框 -->
    <el-dialog
      :title="dialogType === 'create' ? '创建角色' : '编辑角色'"
      v-model="dialogVisible"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="roleForm" :rules="roleRules" ref="roleFormRef" label-width="100px">
        <el-form-item label="角色代码" prop="code" v-if="dialogType === 'create'">
          <el-input v-model="roleForm.code" placeholder="如：teacher" />
        </el-form-item>
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleForm.name" placeholder="如：教师" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="roleForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="权限" prop="permissionIds">
          <div class="permission-groups">
            <div v-for="(perms, module) in permissionGroups" :key="module" class="permission-group">
              <div class="permission-group-title">{{ moduleNameMap[module] || module }}</div>
              <el-checkbox-group v-model="roleForm.permissionIds">
                <el-checkbox
                  v-for="perm in perms"
                  :key="perm.id"
                  :value="perm.id"
                >
                  {{ perm.name }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getAllRoles, createRole, updateRole, deleteRole, getAllPermissions } from '../../services/roleService.js';

const roles = ref([]);
const permissionGroups = ref({});
const dialogVisible = ref(false);
const dialogType = ref('create');
const submitting = ref(false);
const roleFormRef = ref(null);

const moduleNameMap = {
  user: '用户管理',
  assignment: '作业管理',
  submission: '提交管理',
  role: '角色管理',
  permission: '权限管理'
};

const roleForm = reactive({
  id: '',
  code: '',
  name: '',
  description: '',
  permissionIds: []
});

const roleRules = {
  code: [{ required: true, message: '请输入角色代码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }]
};

const loadRoles = async () => {
  try {
    const data = await getAllRoles();
    roles.value = Array.isArray(data) ? data : [];
  } catch (error) {
    ElMessage.error('获取角色列表失败');
  }
};

const loadPermissions = async () => {
  try {
    const data = await getAllPermissions();
    permissionGroups.value = data || {};
  } catch (error) {
    ElMessage.error('获取权限列表失败');
  }
};

const showCreateDialog = () => {
  dialogType.value = 'create';
  roleForm.id = '';
  roleForm.code = '';
  roleForm.name = '';
  roleForm.description = '';
  roleForm.permissionIds = [];
  dialogVisible.value = true;
};

const showEditDialog = (row) => {
  dialogType.value = 'edit';
  roleForm.id = row.id;
  roleForm.code = row.code;
  roleForm.name = row.name;
  roleForm.description = row.description || '';
  roleForm.permissionIds = (row.permissions || []).map(p => p.id);
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  try {
    await roleFormRef.value.validate();
    submitting.value = true;

    const payload = {
      name: roleForm.name,
      description: roleForm.description,
      permissionIds: roleForm.permissionIds
    };

    if (dialogType.value === 'create') {
      payload.code = roleForm.code;
      await createRole(payload);
      ElMessage.success('角色创建成功');
    } else {
      await updateRole(roleForm.id, payload);
      ElMessage.success('角色更新成功');
    }

    dialogVisible.value = false;
    loadRoles();
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败');
  } finally {
    submitting.value = false;
  }
};

const handleDeleteRole = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除角色「${row.name}」吗？删除后将无法恢复。`,
      '确认删除',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    );
    await deleteRole(row.id);
    ElMessage.success('角色删除成功');
    loadRoles();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除角色失败');
    }
  }
};

onMounted(() => {
  loadRoles();
  loadPermissions();
});
</script>

<style scoped>
.role-management {
  background-color: var(--bg-card);
  padding: 30px;
  border-radius: var(--radius-sm);
}

.role-actions {
  margin-bottom: 20px;
}

.permission-groups {
  max-height: 400px;
  overflow-y: auto;
}

.permission-group {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.permission-group:last-child {
  border-bottom: none;
}

.permission-group-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.permission-group .el-checkbox {
  margin-right: 16px;
  margin-bottom: 8px;
}
</style>

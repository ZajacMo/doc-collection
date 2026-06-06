<template>
  <!-- 导入用户对话框 -->
  <el-dialog
    :title="importStep === 0 ? '导入用户' : '预览确认'"
    v-model="localImportDialogVisible"
    :width="importStep === 0 ? '500px' : '800px'"
    :close-on-click-modal="false"
    @closed="resetImport"
  >
    <!-- 步骤1：选择文件 -->
    <div v-if="importStep === 0">
      <div class="upload-area">
        <el-upload
          ref="uploadRef"
          drag
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
          :before-upload="() => false"
          accept=".xls,.xlsx"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            拖拽文件到此处或 <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              请上传包含用户信息的Excel文件，支持 .xls 和 .xlsx 格式
              <br>
              表格需包含列：学号、姓名、班级（可选：角色、专业、邮箱）
              <br>
              班级列支持逗号分隔多个班级，会自动匹配系统中已有的班级名称
            </div>
          </template>
        </el-upload>
      </div>
      <div class="import-template">
        <el-button type="primary" link @click="downloadTemplate">
          <el-icon><Download /></el-icon> 下载导入模板
        </el-button>
      </div>
    </div>

    <!-- 步骤2：预览确认 -->
    <div v-if="importStep === 1">
      <div class="import-stats">
        <el-alert
          :title="`共 ${previewData.length} 条数据，可导入 ${validPreviewCount} 条，${previewData.length - validPreviewCount} 条异常`"
          :type="validPreviewCount > 0 ? 'info' : 'warning'"
          show-icon
          :closable="false"
        />
      </div>
      <el-table
        :data="previewData"
        style="width: 100%"
        stripe
        border
        max-height="400"
        size="small"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="studentId" label="学号" width="120" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="className" label="班级" width="150">
          <template #default="{ row }">
            {{ row.className || '-' }}
            <el-tag v-if="row.classIds.length > 0" type="success" size="small">已匹配 {{ row.classIds.length }} 个</el-tag>
            <el-tag v-else-if="row.className" type="warning" size="small">未匹配</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.role === 'super_admin' ? 'warning' : row.role === 'admin' ? 'danger' : 'primary'" size="small">
              {{ getRoleLabel(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="major" label="专业" width="120" />
        <el-table-column prop="email" label="邮箱" width="150" />
        <el-table-column prop="status" label="状态" width="120" fixed="right">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'valid'" type="success" size="small">正常</el-tag>
            <el-tag v-else type="danger" size="small">{{ row.statusText }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button v-if="importStep === 1" @click="importStep = 0">返回</el-button>
        <el-button @click="closeImportDialog">取消</el-button>
        <el-button
          v-if="importStep === 1"
          type="primary"
          :disabled="validPreviewCount === 0 || importing"
          :loading="importing"
          @click="confirmImport"
        >
          确认导入 ({{ validPreviewCount }})
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 添加用户对话框 -->
  <el-dialog
    title="添加用户"
    v-model="localAddDialogVisible"
    width="500px"
  >
    <el-form
      ref="addUserFormRef"
      :model="addUserForm"
      :rules="addUserRules"
      label-width="100px"
    >
      <el-form-item label="学号" prop="studentId">
        <el-input v-model="addUserForm.studentId"></el-input>
      </el-form-item>
      <el-form-item label="姓名" prop="name">
        <el-input v-model="addUserForm.name"></el-input>
      </el-form-item>
      <el-form-item label="班级" prop="classIds">
        <el-select v-model="addUserForm.classIds" multiple placeholder="选择班级" style="width: 100%">
          <el-option
            v-for="cls in allClasses"
            :key="cls.id"
            :label="cls.name"
            :value="cls.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="角色" prop="role">
        <el-select v-model="addUserForm.role">
          <el-option
            v-for="role in availableRoles"
            :key="role.value"
            :label="role.label"
            :value="role.value"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeAddDialog">取消</el-button>
        <el-button type="primary" @click="handleAddUser">确定</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 编辑用户对话框 -->
  <el-dialog
    title="编辑用户"
    v-model="localEditDialogVisible"
    width="500px"
  >
    <el-form
      ref="editUserFormRef"
      :model="editUserForm"
      :rules="editUserRules"
      label-width="100px"
    >
      <el-form-item label="学号" prop="studentId">
        <el-input v-model="editUserForm.studentId" :disabled="true"></el-input>
      </el-form-item>
      <el-form-item label="姓名" prop="name">
        <el-input v-model="editUserForm.name"></el-input>
      </el-form-item>
      <el-form-item label="班级" prop="classIds">
        <el-select v-model="editUserForm.classIds" multiple placeholder="选择班级" style="width: 100%">
          <el-option
            v-for="cls in allClasses"
            :key="cls.id"
            :label="cls.name"
            :value="cls.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="角色" prop="role">
        <el-select v-model="editUserForm.role">
          <el-option
            v-for="role in availableRoles"
            :key="role.value"
            :label="role.label"
            :value="role.value"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeEditDialog">取消</el-button>
        <el-button type="primary" @click="handleEditUser">确定</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 复用的作业创建对话框组件 -->
  <AssignmentFormDialog
    v-model:visible="localCreateAssignmentDialogVisible"
    dialog-type="create"
    @submit="handleCreateAssignment"
  />
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { UploadFilled, Download } from '@element-plus/icons-vue';
import * as XLSX from 'xlsx';
import { createUser, updateUser, importUsersBatch } from '../../services/userService';
import { createAssignment } from '../../services/assignmentService';
import { getAllRoles } from '../../services/roleService.js';
import { getAllClasses } from '../../services/classService.js';
import AssignmentFormDialog from '../AssignmentFormDialog.vue';

const props = defineProps({
  importDialogVisible: {
    type: Boolean,
    default: false
  },
  addDialogVisible: {
    type: Boolean,
    default: false
  },
  editDialogVisible: {
    type: Boolean,
    default: false
  },
  createAssignmentDialogVisible: {
    type: Boolean,
    default: false
  },
  editUserData: {
    type: Object,
    default: null
  }
});

const emit = defineEmits([
  'update:importDialogVisible',
  'update:addDialogVisible',
  'update:editDialogVisible',
  'update:createAssignmentDialogVisible',
  'data-updated'
]);

// 本地响应式变量，用于存储对话框状态
const localImportDialogVisible = ref(props.importDialogVisible);
const localAddDialogVisible = ref(props.addDialogVisible);
const localEditDialogVisible = ref(props.editDialogVisible);
const localCreateAssignmentDialogVisible = ref(props.createAssignmentDialogVisible);

// 监听props变化，更新本地变量
watch(() => props.importDialogVisible, (newVal) => {
  localImportDialogVisible.value = newVal;
});

watch(() => props.addDialogVisible, (newVal) => {
  localAddDialogVisible.value = newVal;
});

watch(() => props.editDialogVisible, (newVal) => {
  localEditDialogVisible.value = newVal;
});

watch(() => props.createAssignmentDialogVisible, (newVal) => {
  localCreateAssignmentDialogVisible.value = newVal;
});

// 监听本地变量变化，发出更新事件
watch(localImportDialogVisible, (newVal) => {
  emit('update:importDialogVisible', newVal);
});

watch(localAddDialogVisible, (newVal) => {
  emit('update:addDialogVisible', newVal);
});

watch(localEditDialogVisible, (newVal) => {
  emit('update:editDialogVisible', newVal);
});

watch(localCreateAssignmentDialogVisible, (newVal) => {
  emit('update:createAssignmentDialogVisible', newVal);
});

// 监听编辑用户数据变化，确保表单正确填充
watch(() => props.editUserData, (newVal) => {
  if (newVal) {
    editUserForm.value = {
      ...newVal,
      classIds: (newVal.classes || []).map(c => c.id)
    };
  }
}, { deep: true, immediate: true });

// 表单引用和数据
const addUserFormRef = ref(null);
const editUserFormRef = ref(null);
const createAssignmentFormRef = ref(null);
const availableRoles = ref([
  { label: '学生', value: 'student' },
  { label: '管理员', value: 'admin' }
]);

// 班级列表
const allClasses = ref([]);

// 加载可用角色列表
const loadRoles = async () => {
  try {
    const roles = await getAllRoles();
    if (Array.isArray(roles) && roles.length > 0) {
      const roleMap = {
        student: '学生',
        admin: '管理员',
        super_admin: '超级管理员'
      };
      availableRoles.value = roles.map(r => ({
        label: roleMap[r.code] || r.name,
        value: r.code
      }));
    }
  } catch (error) {
    console.error('加载角色列表失败:', error);
  }
};

// 加载班级列表
const loadClasses = async () => {
  try {
    const classes = await getAllClasses();
    allClasses.value = Array.isArray(classes) ? classes : [];
  } catch (error) {
    console.error('加载班级列表失败:', error);
  }
};

const getRoleLabel = (roleCode) => {
  const found = availableRoles.value.find(r => r.value === roleCode);
  return found ? found.label : roleCode;
};

onMounted(() => {
  loadRoles();
  loadClasses();
});

// 添加用户表单
const addUserForm = ref({
  studentId: '',
  name: '',
  classIds: [],
  role: 'student'
});

// 编辑用户表单
const editUserForm = ref({
  id: '',
  studentId: '',
  name: '',
  classIds: [],
  role: 'student'
});

// 表单验证规则
const addUserRules = ref({
  studentId: [
    { required: true, message: '请输入学号', trigger: 'blur' },
    { min: 2, max: 20, message: '学号长度在 2 到 20 个字符之间', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度在 2 到 20 个字符之间', trigger: 'blur' }
  ]
});

const editUserRules = ref({
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度在 2 到 20 个字符之间', trigger: 'blur' }
  ]
});

const closeImportDialog = () => {
  emit('update:importDialogVisible', false);
};

const closeAddDialog = () => {
  resetAddUserForm();
  emit('update:addDialogVisible', false);
};

const closeEditDialog = () => {
  emit('update:editDialogVisible', false);
};

const closeCreateAssignmentDialog = () => {
  emit('update:createAssignmentDialogVisible', false);
};

// 重置表单
const resetAddUserForm = () => {
  addUserForm.value = {
    studentId: '',
    name: '',
    classIds: [],
    role: 'student'
  };
  if (addUserFormRef.value) {
    addUserFormRef.value.resetFields();
  }
};

// 导入用户相关
const importStep = ref(0);
const previewData = ref([]);
const importing = ref(false);
const uploadRef = ref(null);

const handleFileChange = (uploadFile) => {
  const file = uploadFile.raw;
  if (!file) return;

  const ext = file.name.split('.').pop().toLowerCase();
  if (!['xls', 'xlsx'].includes(ext)) {
    ElMessage.error('只支持 .xls 和 .xlsx 格式的Excel文件');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      if (!Array.isArray(jsonData) || jsonData.length === 0) {
        ElMessage.warning('Excel 文件为空或格式不正确');
        return;
      }

      parsePreviewData(jsonData);
      importStep.value = 1;
    } catch (err) {
      ElMessage.error('解析 Excel 文件失败');
      console.error(err);
    }
  };
  reader.readAsArrayBuffer(file);
};

const parsePreviewData = (jsonData) => {
  const seenStudentIds = new Set();
  previewData.value = jsonData.map((row) => {
    const studentId = String(row['学号'] || row['studentId'] || '').trim();
    const name = String(row['姓名'] || row['name'] || '').trim();
    const className = String(row['班级'] || row['className'] || row['class'] || '').trim();
    const role = String(row['角色'] || row['role'] || 'student').trim();
    const major = String(row['专业'] || row['major'] || '').trim();
    const email = String(row['邮箱'] || row['email'] || '').trim();

    let status = 'valid';
    let statusText = '正常';

    if (!studentId) {
      status = 'invalid';
      statusText = '缺少学号';
    } else if (!name) {
      status = 'invalid';
      statusText = '缺少姓名';
    } else if (seenStudentIds.has(studentId)) {
      status = 'invalid';
      statusText = '学号重复';
    }

    seenStudentIds.add(studentId);

    // 动态角色映射：先检查是否是已知的内置角色，否则保留原始值
    const knownRoleMap = {
      '超级管理员': 'super_admin',
      '管理员': 'admin',
      '学生': 'student'
    };
    const mappedRole = knownRoleMap[role] || role;

    // 根据班级名称匹配已有的 classIds（支持逗号分隔多个班级）
    const classIds = [];
    if (className) {
      const names = className.split(/[,，]/).map(n => n.trim()).filter(Boolean);
      for (const n of names) {
        const matched = allClasses.value.find(c => c.name === n);
        if (matched) {
          classIds.push(matched.id);
        }
      }
    }

    return {
      studentId,
      name,
      className,
      classIds,
      role: mappedRole,
      major,
      email,
      status,
      statusText
    };
  });
};

const validPreviewCount = computed(() =>
  previewData.value.filter(item => item.status === 'valid').length
);

const confirmImport = async () => {
  const validUsers = previewData.value.filter(item => item.status === 'valid');
  if (validUsers.length === 0) return;

  importing.value = true;
  try {
    const result = await importUsersBatch(validUsers);
    ElMessage.success(result.message || `成功导入 ${result.successCount} 个用户`);
    if (result.failedCount > 0) {
      ElMessage.warning(`${result.failedCount} 个用户导入失败`);
    }
    closeImportDialog();
    emit('data-updated');
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '导入失败');
  } finally {
    importing.value = false;
  }
};

const resetImport = () => {
  importStep.value = 0;
  previewData.value = [];
  importing.value = false;
  if (uploadRef.value) {
    uploadRef.value.clearFiles();
  }
};

const downloadTemplate = () => {
  const headers = ['学号', '姓名', '班级', '角色', '专业', '邮箱'];
  const firstRole = availableRoles.value.find(r => r.value === 'student') || availableRoles.value[0] || { value: 'student', label: '学生' };
  const firstClass = allClasses.value[0]?.name || '计算机1班';
  const example = [
    { '学号': '2023001', '姓名': '张三', '班级': firstClass, '角色': firstRole.value, '专业': '计算机科学', '邮箱': 'zhangsan@example.com' },
    { '学号': '2023002', '姓名': '李四', '班级': firstClass, '角色': firstRole.value, '专业': '计算机科学', '邮箱': 'lisi@example.com' }
  ];

  const worksheet = XLSX.utils.json_to_sheet(example, { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '用户导入模板');

  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([new Uint8Array(wbout)], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = '用户导入模板.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// 添加用户
const handleAddUser = async () => {
  try {
    await addUserFormRef.value.validate();
    await createUser(addUserForm.value);
    ElMessage.success('用户添加成功');
    closeAddDialog();
    emit('data-updated');
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '用户添加失败');
    console.error('用户添加失败:', error);
  }
};

// 编辑用户
const handleEditUser = async () => {
  try {
    await editUserFormRef.value.validate();
    await updateUser(editUserForm.value.id, editUserForm.value);
    ElMessage.success('用户编辑成功');
    closeEditDialog();
    emit('data-updated');
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '用户编辑失败');
    console.error('用户编辑失败:', error);
  }
};

// 创建作业
const handleCreateAssignment = async (formData) => {
  try {
    await createAssignment(formData);
    ElMessage.success('作业创建成功');
    closeCreateAssignmentDialog();
    emit('data-updated');
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '作业创建失败');
    console.error('作业创建失败:', error);
  }
};
</script>

<style scoped>
.upload-area {
  margin-bottom: 20px;
}

.import-template {
  text-align: right;
}

.import-stats {
  margin-bottom: 15px;
}

.form-tip {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 5px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>

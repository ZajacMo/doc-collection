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
        <el-table-column prop="className" label="班级" width="120" />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : 'primary'" size="small">
              {{ row.role === 'admin' ? '管理员' : '学生' }}
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
      <el-form-item label="班级" prop="className">
        <el-input v-model="addUserForm.className"></el-input>
      </el-form-item>
      <el-form-item label="角色" prop="role">
        <el-select v-model="addUserForm.role">
          <el-option label="学生" value="student"></el-option>
          <el-option label="管理员" value="admin"></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="closeAddDialog">取消</el-button>
      <el-button type="primary" @click="handleAddUser">确定</el-button>
    </div>
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
      <el-form-item label="班级" prop="className">
        <el-input v-model="editUserForm.className"></el-input>
      </el-form-item>
      <el-form-item label="角色" prop="role">
        <el-select v-model="editUserForm.role">
          <el-option label="学生" value="student"></el-option>
          <el-option label="管理员" value="admin"></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="closeEditDialog">取消</el-button>
      <el-button type="primary" @click="handleEditUser">确定</el-button>
    </div>
  </el-dialog>

  <!-- 复用的作业创建对话框组件 -->
  <AssignmentFormDialog
    v-model:visible="localCreateAssignmentDialogVisible"
    dialog-type="create"
    @submit="handleCreateAssignment"
  />
</template>

<script>
import { ref, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { UploadFilled, Download } from '@element-plus/icons-vue';
import * as XLSX from 'xlsx';
import { createUser, updateUser, importUsersBatch } from '../../services/userService';
import { createAssignment } from '../../services/assignmentService';
import AssignmentFormDialog from '../AssignmentFormDialog.vue';

/**
 * 对话框组件
 * 包含所有管理功能所需的对话框：导入用户、添加用户、编辑用户、创建作业
 */
export default {
  name: 'DialogComponents',
  components: {
    AssignmentFormDialog,
    UploadFilled,
    Download
  },
  props: {
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
  },
  emits: [
    'update:importDialogVisible', 
    'update:addDialogVisible', 
    'update:editDialogVisible', 
    'update:createAssignmentDialogVisible',
    'data-updated'
  ],
  setup(props, { emit }) {
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
        editUserForm.value = { ...newVal };
      }
    }, { deep: true });

    // 表单引用和数据
    const addUserFormRef = ref(null);
    const editUserFormRef = ref(null);
    // 作业创建表单引用和数据
    const createAssignmentFormRef = ref(null);
    const createAssignmentForm = ref({
      title: '',
      description: '',
      deadline: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
      namingRule: '{学号}_{姓名}_{作业名称}_{提交日期}',
      fileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar']
    });
    // 添加用户表单
    const addUserForm = ref({
      studentId: '',
      name: '',
      className: '',
      role: 'student'
    });

    // 编辑用户表单
    const editUserForm = ref({
      id: '',
      studentId: '',
      name: '',
      className: '',
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
      ],
      className: [
        { required: true, message: '请输入班级', trigger: 'blur' },
        { min: 2, max: 20, message: '班级长度在 2 到 20 个字符之间', trigger: 'blur' }
      ]
    });

    const editUserRules = ref({
      name: [
        { required: true, message: '请输入姓名', trigger: 'blur' },
        { min: 2, max: 20, message: '姓名长度在 2 到 20 个字符之间', trigger: 'blur' }
      ],
      className: [
        { required: true, message: '请输入班级', trigger: 'blur' },
        { min: 2, max: 20, message: '班级长度在 2 到 20 个字符之间', trigger: 'blur' }
      ]
    });

    // 关闭对话框
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
      resetCreateAssignmentForm();
      emit('update:createAssignmentDialogVisible', false);
    };

    // 重置表单
    const resetAddUserForm = () => {
      addUserForm.value = {
        studentId: '',
        name: '',
        className: '',
        role: 'student'
      };
      if (addUserFormRef.value) {
        addUserFormRef.value.resetFields();
      }
    };

    const resetCreateAssignmentForm = () => {
      createAssignmentForm.value = {
        title: '',
        description: '',
        deadline: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        namingRule: '{学号}_{姓名}_{作业名称}_{提交日期}',
        fileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar']
      };
      if (createAssignmentFormRef.value) {
        createAssignmentFormRef.value.resetFields();
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
      previewData.value = jsonData.map((row, index) => {
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

        return {
          studentId,
          name,
          className,
          role: role === 'admin' || role === '管理员' ? 'admin' : 'student',
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
      const example = [
        { '学号': '2023001', '姓名': '张三', '班级': '计算机1班', '角色': 'student', '专业': '计算机科学', '邮箱': 'zhangsan@example.com' },
        { '学号': '2023002', '姓名': '李四', '班级': '计算机1班', '角色': 'student', '专业': '计算机科学', '邮箱': 'lisi@example.com' }
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
        // 表单验证
        await addUserFormRef.value.validate();
        
        // 调用添加用户接口
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
        // 表单验证
        await editUserFormRef.value.validate();
        
        // 调用更新用户接口
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
        // 调用创建作业接口
        await createAssignment(formData);
        
        ElMessage.success('作业创建成功');
        closeCreateAssignmentDialog();
        emit('data-updated');
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '作业创建失败');
        console.error('作业创建失败:', error);
      }
    };

    return {
      addUserFormRef,
      editUserFormRef,
      createAssignmentFormRef,
      createAssignmentForm,
      addUserForm,
      editUserForm,
      addUserRules,
      editUserRules,
      closeImportDialog,
      closeAddDialog,
      closeEditDialog,
      closeCreateAssignmentDialog,
      downloadTemplate,
      handleAddUser,
      handleEditUser,
      handleCreateAssignment,
      // 导入相关
      importStep,
      previewData,
      validPreviewCount,
      importing,
      uploadRef,
      handleFileChange,
      confirmImport,
      resetImport,
      // 本地响应式变量
      localImportDialogVisible,
      localAddDialogVisible,
      localEditDialogVisible,
      localCreateAssignmentDialogVisible
    };
  }
};
</script>

<style scoped>
/* 对话框样式 */
.upload-excel {
  margin-bottom: 20px;
}

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
  color: #909399;
  margin-top: 5px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
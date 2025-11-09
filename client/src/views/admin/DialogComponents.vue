<template>
  <!-- 导入用户对话框 -->
  <el-dialog 
    title="导入用户" 
    :visible.sync="importDialogVisible"
    width="600px"
  >
    <el-upload
      class="upload-excel"
      :action="uploadExcelUrl"
      :headers="uploadHeaders"
      :on-success="handleImportSuccess"
      :on-error="handleImportError"
      :before-upload="beforeImportExcel"
      accept=".xls,.xlsx"
      :show-file-list="false"
    >
      <el-button size="small" type="primary">点击上传Excel文件</el-button>
      <div slot="tip" class="el-upload__tip">
        请上传包含用户信息的Excel文件，支持.xls和.xlsx格式
      </div>
    </el-upload>
    <div class="import-template">
      <el-button type="text" @click="downloadTemplate">下载导入模板</el-button>
    </div>
    <div slot="footer" class="dialog-footer">
      <el-button @click="closeImportDialog">取消</el-button>
    </div>
  </el-dialog>

  <!-- 添加用户对话框 -->
  <el-dialog 
    title="添加用户" 
    :visible.sync="addDialogVisible"
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
      <el-form-item label="班级" prop="class">
        <el-input v-model="addUserForm.class"></el-input>
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
    :visible.sync="editDialogVisible"
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
      <el-form-item label="班级" prop="class">
        <el-input v-model="editUserForm.class"></el-input>
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

  <!-- 创建作业对话框 -->
  <el-dialog 
    title="创建作业" 
    :visible.sync="createAssignmentDialogVisible"
    width="600px"
  >
    <el-form 
      ref="createAssignmentFormRef" 
      :model="createAssignmentForm" 
      :rules="createAssignmentRules" 
      label-width="100px"
    >
      <el-form-item label="作业名称" prop="title">
        <el-input v-model="createAssignmentForm.title"></el-input>
      </el-form-item>
      <el-form-item label="作业描述" prop="description">
        <el-input 
          v-model="createAssignmentForm.description" 
          type="textarea" 
          placeholder="请输入作业描述"
          :rows="4"
        ></el-input>
      </el-form-item>
      <el-form-item label="截止日期" prop="deadline">
        <el-date-picker
          v-model="createAssignmentForm.deadline"
          type="datetime"
          placeholder="选择截止日期时间"
          style="width: 100%"
        ></el-date-picker>
      </el-form-item>
      <el-form-item label="文件命名规则" prop="namingRule">
        <el-input 
          v-model="createAssignmentForm.namingRule" 
          placeholder="例如：{学号}_{姓名}_{作业名称}_{提交日期}"
        ></el-input>
        <div class="form-tip">支持的变量：{学号}, {姓名}, {作业名称}, {提交日期}</div>
      </el-form-item>
      <el-form-item label="允许的文件类型" prop="fileTypes">
        <el-select 
          v-model="createAssignmentForm.fileTypes" 
          multiple 
          placeholder="选择允许的文件类型"
        >
          <el-option label="PDF" value="pdf"></el-option>
          <el-option label="Word文档" value="doc"></el-option>
          <el-option label="Word文档" value="docx"></el-option>
          <el-option label="Excel表格" value="xls"></el-option>
          <el-option label="Excel表格" value="xlsx"></el-option>
          <el-option label="PPT演示" value="ppt"></el-option>
          <el-option label="PPT演示" value="pptx"></el-option>
          <el-option label="ZIP压缩" value="zip"></el-option>
          <el-option label="RAR压缩" value="rar"></el-option>
          <el-option label="图片" value="jpg"></el-option>
          <el-option label="图片" value="jpeg"></el-option>
          <el-option label="图片" value="png"></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="closeCreateAssignmentDialog">取消</el-button>
      <el-button type="primary" @click="handleCreateAssignment">确定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { createUser, updateUser } from '../../services/userService';
import { createAssignment } from '../../services/assignmentService';

/**
 * 对话框组件
 * 包含所有管理功能所需的对话框：导入用户、添加用户、编辑用户、创建作业
 */
export default {
  name: 'DialogComponents',
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
    // 上传配置
    const uploadExcelUrl = '/api/users/import';
    const uploadHeaders = ref({
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    });

    // 表单引用和数据
    const addUserFormRef = ref(null);
    const editUserFormRef = ref(null);
    const createAssignmentFormRef = ref(null);

    // 添加用户表单
    const addUserForm = ref({
      studentId: '',
      name: '',
      class: '',
      role: 'student'
    });

    // 编辑用户表单
    const editUserForm = ref({
      studentId: '',
      name: '',
      class: '',
      role: 'student'
    });

    // 创建作业表单
    const createAssignmentForm = ref({
      title: '',
      description: '',
      deadline: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 默认一周后
      namingRule: '{学号}_{姓名}_{作业名称}_{提交日期}',
      fileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar']
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
      class: [
        { required: true, message: '请输入班级', trigger: 'blur' },
        { min: 2, max: 20, message: '班级长度在 2 到 20 个字符之间', trigger: 'blur' }
      ]
    });

    const editUserRules = ref({
      name: [
        { required: true, message: '请输入姓名', trigger: 'blur' },
        { min: 2, max: 20, message: '姓名长度在 2 到 20 个字符之间', trigger: 'blur' }
      ],
      class: [
        { required: true, message: '请输入班级', trigger: 'blur' },
        { min: 2, max: 20, message: '班级长度在 2 到 20 个字符之间', trigger: 'blur' }
      ]
    });

    const createAssignmentRules = ref({
      title: [
        { required: true, message: '请输入作业名称', trigger: 'blur' },
        { min: 2, max: 100, message: '作业名称长度在 2 到 100 个字符之间', trigger: 'blur' }
      ],
      description: [{ required: true, message: '请输入作业描述', trigger: 'blur' }],
      deadline: [{ required: true, message: '请选择截止日期', trigger: 'change' }],
      namingRule: [{ required: true, message: '请输入文件命名规则', trigger: 'blur' }],
      fileTypes: [{
        required: true,
        message: '请至少选择一种文件类型',
        trigger: 'change',
        type: 'array',
        min: 1
      }]
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
        class: '',
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
    const beforeImportExcel = (file) => {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!['xls', 'xlsx'].includes(fileExtension)) {
        ElMessage.error('只支持.xls和.xlsx格式的Excel文件');
        return false;
      }
      return true;
    };

    const handleImportSuccess = (response) => {
      if (response.success) {
        ElMessage.success(`成功导入 ${response.data.successCount} 个用户`);
        if (response.data.failedCount > 0) {
          ElMessage.warning(`有 ${response.data.failedCount} 个用户导入失败`);
        }
        closeImportDialog();
        emit('data-updated');
      } else {
        ElMessage.error(response.message || '用户导入失败');
      }
    };

    const handleImportError = (error) => {
      ElMessage.error('用户导入失败，请重试');
      console.error('用户导入失败:', error);
    };

    const downloadTemplate = () => {
      // 这里应该提供一个模板文件下载链接
      ElMessage.info('模板下载功能待实现');
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
        await updateUser(editUserForm.value.studentId, editUserForm.value);
        
        ElMessage.success('用户编辑成功');
        closeEditDialog();
        emit('data-updated');
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '用户编辑失败');
        console.error('用户编辑失败:', error);
      }
    };

    // 创建作业
    const handleCreateAssignment = async () => {
      try {
        // 表单验证
        await createAssignmentFormRef.value.validate();
        
        // 调用创建作业接口
        await createAssignment(createAssignmentForm.value);
        
        ElMessage.success('作业创建成功');
        closeCreateAssignmentDialog();
        emit('data-updated');
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '作业创建失败');
        console.error('作业创建失败:', error);
      }
    };

    // 监听编辑用户数据变化
    if (props.editUserData) {
      editUserForm.value = { ...props.editUserData };
    }

    return {
      uploadExcelUrl,
      uploadHeaders,
      addUserFormRef,
      editUserFormRef,
      createAssignmentFormRef,
      addUserForm,
      editUserForm,
      createAssignmentForm,
      addUserRules,
      editUserRules,
      createAssignmentRules,
      closeImportDialog,
      closeAddDialog,
      closeEditDialog,
      closeCreateAssignmentDialog,
      beforeImportExcel,
      handleImportSuccess,
      handleImportError,
      downloadTemplate,
      handleAddUser,
      handleEditUser,
      handleCreateAssignment
    };
  }
};
</script>

<style scoped>
/* 对话框样式 */
.upload-excel {
  margin-bottom: 20px;
}

.import-template {
  text-align: right;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style>
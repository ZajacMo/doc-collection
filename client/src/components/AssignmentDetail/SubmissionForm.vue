<template>
  <div class="submit-form-container">
    <el-form
      ref="submitFormRef"
      :model="submitForm"
      :rules="submitRules"
      label-width="100px"
    >
      <!-- 用户信息显示和手动输入选项 -->
      <el-form-item label="学号" prop="studentId">
        <el-input
          v-model="submitForm.studentId"
          placeholder="请输入学号"
          :disabled="submitForm.studentId && !manualInputEnabled"
        >
          <template #append>
            <el-button
              size="small"
              type="text"
              @click="toggleManualInput"
            >
              {{ manualInputEnabled ? '自动获取' : '手动输入' }}
            </el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="姓名" prop="studentName">
        <el-input
          v-model="submitForm.studentName"
          placeholder="请输入姓名"
          :disabled="submitForm.studentName && !manualInputEnabled"
        >
          <template #append>
            <el-button
              size="small"
              type="text"
              @click="toggleManualInput"
            >
              {{ manualInputEnabled ? '自动获取' : '手动输入' }}
            </el-button>
          </template>
        </el-input>
        <el-tag v-if="!submitForm.studentId" type="warning" size="small" style="margin-top: 5px; display: block;">
          提示：如果自动获取失败，请手动输入学号和姓名
        </el-tag>
      </el-form-item>

      <el-form-item label="提交文件" prop="fileId">
        <el-upload
          class="upload-demo"
          :http-request="handleCustomUpload"
          :before-upload="beforeUpload"
          :show-file-list="true"
          :file-list="fileList"
          :multiple="false"
          :on-remove="handleRemove"
          :disabled="isAssignmentExpired"
          drag
        >
          <template #default>
            <el-button
              size="small"
              type="primary"
              :disabled="isAssignmentExpired"
            >
              {{ isAssignmentExpired ? '作业已过期，无法上传' : !!submissionInfo && submissionInfo.submissionInfo ? '重新上传' : '选择文件' }}
            </el-button>
            <el-tag
              v-if="submissionInfo && submissionInfo.submissionInfo"
              type="success"
              size="small"
              style="margin-top: 5px; display: block;">
              已提交：{{ submissionInfo.submissionInfo.fileName }}
            </el-tag>
          </template>
          <template #tip>
            <div class="el-upload__tip">
              支持的文件大小不超过20MB
              <div style="margin-top:6px;color: var(--text-secondary);">
                允许类型：
                <template v-if="allowedFileTypes && allowedFileTypes.length > 0">
                  {{ allowedFileTypes.join(', ') }}
                </template>
                <template v-else>
                  不限类型
                </template>
              </div>
            </div>
          </template>
        </el-upload>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { validateFileType } from '../../services/submissionService';
import { getCurrentUserInfo } from '../../services/userService';
import api from '../../utils/axios';

const props = defineProps({
  assignmentId: {
    type: String,
    required: true
  },
  assignmentName: {
    type: String,
    required: true
  },
  isAssignmentExpired: {
    type: Boolean,
    required: true
  },
  submissionInfo: {
    type: Object,
    required: true
  },
  allowedFileTypes: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['submission-success']);

const submitFormRef = ref(null);
const fileList = ref([]);
const uploadSuccess = ref(false);
const originalFile = ref(null);
const manualInputEnabled = ref(false);

// 表单数据：优先从 getCurrentUserInfo 获取，避免切换账号后显示旧信息
const currentUser = getCurrentUserInfo();
const submitForm = reactive({
  studentId: currentUser?.studentId || '',
  studentName: currentUser?.name || '',
  assignmentName: props.assignmentName,
  file: null
});

// 表单验证规则
const submitRules = reactive({
  assignmentName: [
    { required: true, message: '作业名称不能为空', trigger: 'blur' }
  ],
  studentId: [
    { required: true, message: '请输入学号', trigger: 'blur' }
  ],
  studentName: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ]
});

// 切换手动输入模式
const toggleManualInput = () => {
  manualInputEnabled.value = !manualInputEnabled.value;
};

// 上传前验证
const beforeUpload = (file) => {
  const maxSize = 20 * 1024 * 1024;
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过20MB');
    return false;
  }
  if (Array.isArray(props.allowedFileTypes) && props.allowedFileTypes.length > 0) {
    const isValidType = validateFileType(file, props.allowedFileTypes);
    if (!isValidType) {
      ElMessage.error(`不支持的文件类型，仅允许：${props.allowedFileTypes.join(', ')}`);
      return false;
    }
  }
  return true;
};

// 自定义上传：将文件和表单数据一起提交到 /api/submissions（一步原子操作）
const handleCustomUpload = async (options) => {
  const file = options.file;
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('assignmentId', props.assignmentId);
    formData.append('studentId', submitForm.studentId);
    formData.append('studentName', submitForm.studentName);
    formData.append('assignmentName', submitForm.assignmentName);

    const response = await api.post('/submissions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    uploadSuccess.value = true;
    if (fileList.value.length > 0) {
      fileList.value[0].status = 'success';
      originalFile.value = fileList.value[0].raw;
    }

    ElMessage.success('作业提交成功！');
    localStorage.setItem('studentId', submitForm.studentId);
    localStorage.setItem('studentName', submitForm.studentName);
    setTimeout(() => {
      emit('submission-success');
    }, 1500);

    return response;
  } catch (error) {
    uploadSuccess.value = false;
    const errorMsg = error.response?.data?.message || error.message || '作业提交失败，请重试';
    ElMessage.error(errorMsg);

    if (errorMsg.includes('学生不存在')) {
      ElMessageBox.confirm(
        '检测到学生信息可能不匹配，是否清除缓存并重新获取用户信息？',
        '提示',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
      ).then(() => {
        localStorage.removeItem('studentId');
        localStorage.removeItem('studentName');
        window.location.reload();
      }).catch(() => {});
    }
    throw error;
  }
};

// 处理文件移除
const handleRemove = (file, fileList) => {
  fileList.value = fileList;
  uploadSuccess.value = false;
};

// 组件挂载时初始化数据
onMounted(() => {
  const currentUserInfo = getCurrentUserInfo();
  if (currentUserInfo?.studentId && !submitForm.studentId) {
    submitForm.studentId = currentUserInfo.studentId;
  }
  if (currentUserInfo?.name && !submitForm.studentName) {
    submitForm.studentName = currentUserInfo.name;
  }
});
</script>

<style scoped>
.submit-form-container {
  max-width: 800px;
  margin: 20px auto 0;
}

.form-tip {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 5px;
}
</style>

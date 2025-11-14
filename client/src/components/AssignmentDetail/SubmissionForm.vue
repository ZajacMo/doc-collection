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
          :action="uploadUrl"
          :headers="uploadHeaders"
          :on-success="handleUploadSuccess"
          :on-error="handleUploadError"
          :before-upload="beforeUpload"
          :data="getUploadData()"
          :show-file-list="true"
          :file-list="fileList"
          :multiple="false"
          :on-remove="handleRemove"
          :disabled="isAssignmentExpired"
          drag
        >
          <el-button 
            size="small" 
            type="primary"
            :disabled="isAssignmentExpired"
          >
            {{ isAssignmentExpired ? '作业已过期，无法上传' : !!submissionInfo && submissionInfo.submissionInfo ? '重新上传' : '选择文件' }}
          </el-button>
          <div slot="default">
            <el-tag v-if="submissionInfo && submissionInfo.submissionInfo" type="success" size="small" style="margin-top: 5px; display: block;">
              已提交：{{ submissionInfo.submissionInfo.fileName }}
            </el-tag>
          </div>
      <div slot="tip" class="el-upload__tip">
        支持的文件大小不超过20MB
        <div style="margin-top:6px;color:#606266;">
          允许类型：
          <template v-if="allowedFileTypes && allowedFileTypes.length > 0">
            {{ allowedFileTypes.join(', ') }}
          </template>
          <template v-else>
            不限类型
          </template>
        </div>
      </div>
        </el-upload>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { submitAssignment, validateFileType } from '../../services/submissionService';
import { getCurrentUserInfo } from '../../services/userService';
import { UPLOAD_URL } from '../../config/apiConfig';

export default {
  name: 'SubmissionForm',
  props: {
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
  },
  emits: ['submission-success'],
  setup(props, { emit }) {
    const submitFormRef = ref(null);
    const fileList = ref([]);
    const uploadUrl = UPLOAD_URL;
    const uploadHeaders = ref({});
    const uploadSuccess = ref(false);
    const originalFile = ref(null);
    const manualInputEnabled = ref(false);
    
    // 表单数据
    const submitForm = reactive({
      studentId: localStorage.getItem('studentId') || '',
      studentName: localStorage.getItem('studentName') || '',
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
    
    // 获取上传数据
    const getUploadData = () => {
      const data = {
        studentId: submitForm.studentId || 
                  getCurrentUserInfo()?.studentId || 
                  localStorage.getItem('studentId') || '',
        studentName: submitForm.studentName || 
                    getCurrentUserInfo()?.name || 
                    localStorage.getItem('studentName') || '',
        assignmentId: props.assignmentId,
        assignmentName: submitForm.assignmentName,
        description: submitForm.description || ''
      };
      return data;
    };
    
    // 上传前验证
    const beforeUpload = (file) => {
      // 检查文件大小（20MB）
      const maxSize = 20 * 1024 * 1024;
      if (file.size > maxSize) {
        ElMessage.error('文件大小不能超过20MB');
        return false;
      }

      // 检查文件类型（来自作业配置）
      if (Array.isArray(props.allowedFileTypes) && props.allowedFileTypes.length > 0) {
        const isValidType = validateFileType(file, props.allowedFileTypes);
        if (!isValidType) {
          ElMessage.error(`不支持的文件类型，仅允许：${props.allowedFileTypes.join(', ')}`);
          return false;
        }
      }
      return true;
    };
    
    // 处理上传成功
    const handleUploadSuccess = async (response, file, fileListParam) => {
      const isSuccess = response && (response.id || response.success === true || response.code === 200 || response.code === '200');
      
      if (isSuccess) {
        uploadSuccess.value = true;
        
        if (fileListParam && fileListParam.length > 0) {
          fileList.value = JSON.parse(JSON.stringify(fileListParam));
          // console.log('上传成功后的fileList:', fileList.value);
          fileList.value[0].status = 'success';
          originalFile.value = fileList.value[0].raw;

          
          // 修改前端显示的文件名：用姓名-学号覆盖原文件名
          const fileExtension = file.name.split('.').pop().toLowerCase();
          const newFileName = `${submitForm.studentName}-${submitForm.studentId}.${fileExtension}`;
          fileList.value[0].name = newFileName;
        }
        
        try {
          await submitFormRef.value.validate();
          
          const formData = {
            assignmentId: props.assignmentId,
            studentId: submitForm.studentId,
            studentName: submitForm.studentName,
            assignmentName: submitForm.assignmentName,
            fileName: fileList.value?.[0]?.name || '',
            filePath: response.path || response.filePath,
            fileSize: fileList.value?.[0]?.size || 0,
            fileId: response.id || response.fileId
          };
          
          await submitAssignment(formData);
          
          ElMessage.success('作业提交成功！');
          
          // 保存到localStorage
          localStorage.setItem('studentId', submitForm.studentId);
          localStorage.setItem('studentName', submitForm.studentName);
          
          // 触发成功事件
          setTimeout(() => {
            emit('submission-success');
          }, 1500);
          
        } catch (error) {
          const errorMsg = error.response?.data?.message || error.message || '作业提交失败，请重试';
          ElMessage.error(errorMsg);
          
          if (errorMsg.includes('文件')) {
            ElMessage.warning('请重新上传文件后再尝试提交');
            uploadSuccess.value = false;
          }
        }
      } else {
        ElMessage.error('文件上传失败');
        uploadSuccess.value = false;
      }
    };
    
    // 处理上传错误
    const handleUploadError = (error) => {
      let errorMessage = '文件上传失败';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = '文件上传失败: ' + error.response.data.message;
      } else if (error.message) {
        errorMessage = '文件上传失败: ' + error.message;
      }
      
      ElMessage.error(errorMessage);
      
      if (error.response?.data?.message === '学生不存在') {
        ElMessageBox.confirm(
          '检测到学生信息可能不匹配，是否清除缓存并重新获取用户信息？',
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        ).then(() => {
          localStorage.removeItem('studentId');
          localStorage.removeItem('studentName');
          window.location.reload();
        }).catch(() => {});
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
    
    return {
      submitFormRef,
      fileList,
      uploadUrl,
      uploadHeaders,
      submitForm,
      submitRules,
      manualInputEnabled,
      uploadSuccess,
      originalFile,
      getUploadData,
      beforeUpload,
      handleUploadSuccess,
      handleUploadError,
      handleRemove,
      toggleManualInput
    };
  }
};
</script>

<style scoped>
.submit-form-container {
  max-width: 800px;
  margin: 20px auto 0;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style>

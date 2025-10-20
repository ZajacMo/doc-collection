<template>
  <div class="submit-assignment-container">
    <el-container>
      <!-- 顶部导航栏 -->
      <el-header class="header">
        <div class="header-content">
          <div class="header-title">
            <i class="el-icon-document"></i>
            <span>作业收集系统</span>
          </div>
        </div>
      </el-header>

      <!-- 主内容区域 -->
      <el-container>

        <!-- 内容区域 -->
        <el-main class="main">
          <!-- 返回按钮 -->
          <div class="back-button-container">
            <el-button type="text" @click="goBack">
              <i class="el-icon-arrow-left"></i>
              返回作业详情
            </el-button>
          </div>

          <!-- 加载状态 -->
          <div v-if="loading" class="loading-container">
            <el-loading-spinner></el-loading-spinner>
            <p>加载中...</p>
          </div>

          <!-- 作业提交表单 -->
          <div v-else-if="assignment" class="submit-form-container">
            <!-- 作业标题 -->
            <div class="assignment-title-section">
              <h1>提交作业：{{ assignment.title }}</h1>
              <div v-if="isAssignmentExpired(assignment.deadline)" class="expired-warning">
                <el-alert 
                  title="作业已逾期" 
                  type="error"
                  description="该作业已过截止日期，是否继续提交？"
                  show-icon
                ></el-alert>
              </div>
              <div v-else-if="isAssignmentUrgent(assignment.deadline)" class="urgent-warning">
                <el-alert 
                  title="作业即将截止" 
                  type="warning"
                  description="距离截止日期还有不到24小时，请尽快提交！"
                  show-icon
                ></el-alert>
              </div>
            </div>

            <!-- 文件命名规则提示 -->
            <div class="naming-rule-tip">
              <el-card class="rule-tip-card">
                <div class="rule-tip-header">
                  <i class="el-icon-warning"></i>
                  <span>重要提示</span>
                </div>
                <div class="rule-tip-content">
                  <p>请严格按照以下命名规则提交文件：</p>
                  <pre>{{ assignment.namingRule }}</pre>
                  <p class="example">示例：{{ generateExampleFileName() }}</p>
                </div>
              </el-card>
            </div>

            <!-- 提交表单 -->
            <el-card class="submit-form-card">
              <el-form 
                ref="submitFormRef" 
                :model="submitForm" 
                :rules="submitRules" 
                label-width="100px"
              >
                <el-form-item label="学号" prop="studentId">
                  <el-input v-model="submitForm.studentId" placeholder="请输入您的学号"></el-input>
                </el-form-item>
                <el-form-item label="姓名" prop="studentName">
                  <el-input v-model="submitForm.studentName" placeholder="请输入您的姓名"></el-input>
                </el-form-item>
                <el-form-item label="作业名称" prop="assignmentName">
                  <el-input v-model="submitForm.assignmentName" :disabled="true"></el-input>
                </el-form-item>
                <el-form-item label="提交文件" prop="file">
                  <el-upload
                    class="upload-demo"
                    :action="uploadUrl"
                    :headers="uploadHeaders"
                    :on-success="handleUploadSuccess"
                    :on-error="handleUploadError"
                    :before-upload="beforeUpload"
                    :data="getUploadData"
                    :show-file-list="true"
                    :file-list="fileList"
                    multiple="false"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.jpg,.jpeg,.png"
                  >
                    <el-button size="small" type="primary">选择文件</el-button>
                    <div slot="tip" class="el-upload__tip">
                      支持的文件类型：{{ assignment.fileTypes.join('、') }}，文件大小不超过20MB
                    </div>
                  </el-upload>
                </el-form-item>
                <el-form-item label="提交说明" prop="description">
                  <el-input 
                    v-model="submitForm.description" 
                    type="textarea" 
                    placeholder="请输入提交说明（可选）"
                    :rows="3"
                  ></el-input>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleSubmit">提交作业</el-button>
                  <el-button @click="cancelSubmit">取消</el-button>
                </el-form-item>
              </el-form>
            </el-card>


          </div>

          <!-- 错误提示 -->
          <div v-else class="error-container">
            <el-alert 
              title="无法加载作业信息" 
              type="error"
              description="请检查作业ID是否正确或联系管理员"
              show-icon
            ></el-alert>
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getAssignmentById,
  isAssignmentExpired
} from '../services/assignmentService';
import {
  submitAssignment,
  downloadFile as downloadFileAPI,
  validateFileName
} from '../services/submissionService';

export default {
  name: 'SubmitAssignmentView',
  setup() {
    const userInfo = ref({});
    const assignment = ref(null);
    const submissionHistory = ref([]);
    const loading = ref(true);
    const submitFormRef = ref(null);
    const fileList = ref([]);
    const uploadUrl = 'http://localhost:3001/api/submissions/upload';
    const uploadHeaders = ref({});
    
    const submitForm = ref({
      studentId: '',
      studentName: '',
      assignmentName: '',
      description: '',
      file: null
    });
    
    const submitRules = ref({
      studentId: [
        { required: true, message: '请输入学号', trigger: 'blur' }
      ],
      studentName: [
        { required: true, message: '请输入姓名', trigger: 'blur' }
      ],
      assignmentName: [
        { required: true, message: '作业名称不能为空', trigger: 'blur' }
      ],
      file: [
        { required: true, message: '请选择要上传的文件', trigger: 'change' }
      ]
    });
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };
    
    // 格式化文件大小
    const formatFileSize = (bytes) => {
      if (!bytes) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    // 检查作业是否紧急（24小时内截止）
    const isAssignmentUrgent = (deadline) => {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const diff = deadlineDate - now;
      return diff > 0 && diff < 24 * 60 * 60 * 1000;
    };
    
    // 生成示例文件名
    const generateExampleFileName = () => {
      if (!assignment.value) return '';
      
      let exampleName = assignment.value.namingRule;
      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      
      exampleName = exampleName.replace('{学号}', '1001');
      exampleName = exampleName.replace('{姓名}', '张三');
      exampleName = exampleName.replace('{作业名称}', assignment.value.title.replace(/[\s\/\\:*?"<>|]/g, ''));
      exampleName = exampleName.replace('{提交日期}', dateStr);
      
      return exampleName;
    };
    
    // 获取作业ID
    const getAssignmentIdFromUrl = () => {
      const path = window.location.pathname;
      const parts = path.split('/');
      return parts[parts.length - 1];
    };
    
    // 加载数据
    const loadData = async () => {
      try {
        loading.value = true;
        const assignmentId = getAssignmentIdFromUrl();
        
        // 获取作业详情
        const assignmentData = await getAssignmentById(assignmentId);
        assignment.value = assignmentData;
        
        // 更新表单数据
        submitForm.value.assignmentName = assignmentData.title;
        
      } catch (error) {
        ElMessage.error('加载作业信息失败');
        console.error('加载作业信息失败:', error);
      } finally {
        loading.value = false;
      }
    };
    
    // 返回作业详情
    const goBack = () => {
      window.location.href = `/assignments/${getAssignmentIdFromUrl()}`;
    };
    

    

    
    // 上传前验证
    const beforeUpload = (file) => {
      // 检查文件类型
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!assignment.value.fileTypes.includes(fileExtension)) {
        ElMessage.error(`不支持的文件类型：${fileExtension}，请上传：${assignment.value.fileTypes.join('、')} 格式的文件`);
        return false;
      }
      
      // 检查文件大小（20MB）
      const maxSize = 20 * 1024 * 1024;
      if (file.size > maxSize) {
        ElMessage.error('文件大小不能超过20MB');
        return false;
      }
      
      // 检查文件名是否符合规则
      const isValid = validateFileName(file.name, assignment.value.namingRule, {studentId: submitForm.value.studentId, name: submitForm.value.studentName}, assignment.value.title);
      if (!isValid.isValid) {
        ElMessage.error(`文件名不符合规则：${isValid.message}`);
        return false;
      }
      
      // 检查是否已过截止日期
      if (isAssignmentExpired(assignment.value.deadline)) {
        return ElMessageBox.confirm(
          '该作业已过截止日期，是否继续提交？',
          '确认提交',
          {
            confirmButtonText: '继续提交',
            cancelButtonText: '取消',
            type: 'warning'
          }
        ).then(() => {
          return true;
        }).catch(() => {
          return false;
        });
      }
      
      return true;
    };
    
    // 获取上传数据
    const getUploadData = () => {
      return {
        assignmentId: getAssignmentIdFromUrl(),
        studentId: submitForm.value.studentId,
        studentName: submitForm.value.studentName
      };
    };
    
    // 处理上传成功
    const handleUploadSuccess = (response) => {
      if (response.success) {
        submitForm.value.file = response.data.fileId;
        fileList.value = [{ name: response.data.fileName, url: '', status: 'success' }];
        ElMessage.success('文件上传成功');
      } else {
        ElMessage.error(response.message || '文件上传失败');
      }
    };
    
    // 处理上传失败
    const handleUploadError = (error) => {
      ElMessage.error('文件上传失败，请重试');
      console.error('文件上传失败:', error);
    };
    
    // 处理提交作业
    const handleSubmit = async () => {
      try {
        // 表单验证
        await submitFormRef.value.validate();
        
        if (!submitForm.value.file) {
          ElMessage.error('请先上传文件');
          return;
        }
        
        // 提交作业
        const assignmentId = getAssignmentIdFromUrl();
        await submitAssignment({
          assignmentId,
          studentId: submitForm.value.studentId,
          studentName: submitForm.value.studentName,
          fileId: submitForm.value.file,
          fileName: fileList.value[0].name,
          description: submitForm.value.description,
          status: isAssignmentExpired(assignment.value.deadline) ? 'late' : 'submitted'
        });
        
        ElMessage.success('作业提交成功！');
        
        // 显示成功提示，并重定向到作业详情页
        setTimeout(() => {
          window.location.href = `/assignments/${assignmentId}`;
        }, 1500);
        
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '作业提交失败，请重试');
        console.error('作业提交失败:', error);
      }
    };
    
    // 取消提交
    const cancelSubmit = () => {
      goBack();
    };
    
    // 下载历史文件
    const downloadHistoryFile = async (fileId, fileName) => {
      try {
        await downloadFileAPI(fileId, fileName);
      } catch (error) {
        ElMessage.error('文件下载失败');
        console.error('文件下载失败:', error);
      }
    };
    
    // 组件挂载时加载数据
    onMounted(() => {
      loadData();
    });
    
    return {
      assignment,
      loading,
      submitFormRef,
      fileList,
      uploadUrl,
      uploadHeaders,
      submitForm,
      submitRules,
      formatDate,
      formatFileSize,
      isAssignmentExpired,
      isAssignmentUrgent,
      generateExampleFileName,
      goBack,
      beforeUpload,
      getUploadData,
      handleUploadSuccess,
      handleUploadError,
      handleSubmit,
      cancelSubmit
    };
  }
};
</script>

<style scoped>
.submit-assignment-container {
  height: 100vh;
  overflow: scroll;
}

.header {
  background-color: #1890ff;
  color: white;
  height: 60px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
}

.header-title {
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: bold;
}

.header-title i {
  margin-right: 10px;
}

.header-user {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.aside {
  background-color: #304156;
  color: white;
}

.el-menu-vertical-demo {
  background-color: #304156;
  border-right: none;
}

.el-menu-vertical-demo .el-menu-item {
  color: rgba(255, 255, 255, 0.65);
}

.el-menu-vertical-demo .el-menu-item:hover {
  background-color: #1890ff;
  color: white;
}

.el-menu-vertical-demo .el-menu-item.is-active {
  background-color: #1890ff;
  color: white;
}

.main {
  background-color: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}

.back-button-container {
  margin-bottom: 20px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
}

.submit-form-container {
  max-width: 800px;
  margin: 0 auto;
}

.assignment-title-section {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.assignment-title-section h1 {
  color: #303133;
  margin: 0 0 20px 0;
  font-size: 24px;
}

.expired-warning {
  margin-top: 20px;
}

.urgent-warning {
  margin-top: 20px;
}

.naming-rule-tip {
  margin-bottom: 20px;
}

.rule-tip-card {
  border-left: 4px solid #e6a23c;
}

.rule-tip-header {
  display: flex;
  align-items: center;
  color: #e6a23c;
  font-weight: bold;
  margin-bottom: 15px;
}

.rule-tip-header i {
  margin-right: 10px;
}

.rule-tip-content {
  color: #606266;
}

.rule-tip-content p {
  margin: 10px 0;
}

.rule-tip-content pre {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 16px;
  color: #e6a23c;
  font-weight: bold;
  margin: 10px 0;
}

.example {
  color: #909399;
  font-size: 14px;
  font-style: italic;
}

.submit-form-card {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.submission-history {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
}

.submission-history h3 {
  color: #303133;
  margin-bottom: 20px;
  font-size: 18px;
}

.error-container {
  max-width: 800px;
  margin: 0 auto;
  margin-top: 100px;
}
</style>
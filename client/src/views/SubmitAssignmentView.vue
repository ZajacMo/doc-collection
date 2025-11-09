<template>
  <div class="submit-assignment-container">


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
            <el-icon class="is-loading" style="font-size: 48px;">
              <loading />
            </el-icon>
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



            <!-- 提交表单 -->
            <el-card class="submit-form-card">
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
              <template slot="append">
                <el-button 
                  size="small" 
                  type="text" 
                  @click="manualInputEnabled = !manualInputEnabled"
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
              <template slot="append">
                <el-button 
                  size="small" 
                  type="text" 
                  @click="manualInputEnabled = !manualInputEnabled"
                >
                  {{ manualInputEnabled ? '自动获取' : '手动输入' }}
                </el-button>
              </template>
            </el-input>
            <el-tag v-if="!submitForm.studentId" type="warning" size="small" style="margin-top: 5px; display: block;">
              提示：如果自动获取失败，请手动输入学号和姓名
            </el-tag>
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
                    :data="getUploadData()"
                    :show-file-list="true"
                    :file-list="fileList"
                    :multiple="false"
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
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import {
  getAssignmentById,
  isAssignmentExpired
} from '../services/assignmentService';
import {
  submitAssignment,
  downloadFile as downloadFileAPI,
  validateFileName
} from '../services/submissionService';
import { getCurrentUser } from '../services/userService';

export default {
  name: 'SubmitAssignmentView',
  components: {
    Loading
  },
  setup() {
    const userInfo = ref({});
    const assignment = ref(null);
    const submissionHistory = ref([]);
    const loading = ref(true);
    const submitFormRef = ref(null);
    const fileList = ref([]);
    const uploadUrl = 'http://localhost:3001/api/submissions';
    const uploadHeaders = ref({});
    
    // 表单数据 - 添加默认值以避免空字符串问题
    const submitForm = ref({
      studentId: localStorage.getItem('studentId') || '', // 尝试从localStorage直接获取
      studentName: localStorage.getItem('studentName') || '',
      assignmentName: '',
      description: '',
      file: null
    });
    
    // 是否启用手动输入
    const manualInputEnabled = ref(false);
    
    const submitRules = ref({
      assignmentName: [
        { required: true, message: '作业名称不能为空', trigger: 'blur' }
      ],
      studentId: [
        { required: true, message: '请输入学号', trigger: 'blur' }
      ],
      studentName: [
        { required: true, message: '请输入姓名', trigger: 'blur' }
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
        // 从localStorage获取用户信息
        const userData = getCurrentUser();
        
        // console.log('用户数据:', userData);
        // console.log('用户嵌套信息:', userData?.user);
        
        assignment.value = assignmentData;
        userInfo.value = userData;
        
        // 更新表单数据
        submitForm.value.assignmentName = assignmentData.title;
        
        // 修正：尝试多种方式获取学生信息，确保studentId不为空
        const userIdFromUserData = userData?.user?.studentId;
        const userIdFromLocalStorage = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).user?.studentId : null;
        
        submitForm.value.studentId = userIdFromUserData || userIdFromLocalStorage || submitForm.value.studentId;
        submitForm.value.studentName = userData?.user?.name || (localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).user?.name : '') || submitForm.value.studentName;
        
        // 保存到localStorage以便下次使用
        if (submitForm.value.studentId) {
          localStorage.setItem('studentId', submitForm.value.studentId);
        }
        if (submitForm.value.studentName) {
          localStorage.setItem('studentName', submitForm.value.studentName);
        }
        
        // console.log('表单数据:', submitForm.value);
        
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
      
      // 由于系统会自动重命名文件，这里不再验证原始文件名格式
      // 只验证文件类型和大小
      
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
      // 验证studentId是否存在
      if (!submitForm.value.studentId && !userInfo.value?.user?.studentId) {
        ElMessage.error('无法获取学号信息，请刷新页面或重新登录');
        console.error('学号信息缺失:', { submitForm: submitForm.value, userInfo: userInfo.value });
      }
      
      const studentIdValue = submitForm.value.studentId || 
                            userInfo.value?.user?.studentId || 
                            (localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).user?.studentId : '') || 
                            localStorage.getItem('studentId') || '';
      
      const studentNameValue = submitForm.value.studentName || 
                              userInfo.value?.user?.name || 
                              (localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).user?.name : '') || 
                              localStorage.getItem('studentName') || '';
      
      const data = {
        assignmentId: getAssignmentIdFromUrl(),
        studentId: studentIdValue,
        studentName: studentNameValue,
        assignmentName: submitForm.value.assignmentName,
        description: submitForm.value.description || '',
        autoRename: true
      };
      
      // console.log('上传数据:', data);
      return data;
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
    
    // 处理上传错误
    const handleUploadError = (error) => {
      // 显示更详细的错误信息
      let errorMessage = '文件上传失败';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = '文件上传失败: ' + error.response.data.message;
      } else if (error.message) {
        errorMessage = '文件上传失败: ' + error.message;
      }
      
      ElMessage.error(errorMessage);
      console.error('文件上传失败详情:', error);
      
      // 如果是学生不存在错误，尝试清除缓存并重新获取用户信息
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
          // 重新加载页面
          window.location.reload();
        }).catch(() => {});
      }
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
      manualInputEnabled,
      formatDate,
      formatFileSize,
      isAssignmentExpired,
      isAssignmentUrgent,
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
  height: calc(100vh - 60px);
  width: 100%;
  overflow: scroll;
}

.header {
  background-color: #1890ff;
  color: white;
  height: 60px;
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
  max-width: 90%;
  margin: 0 auto;
  margin-top: 50px;
}

/* 表单元素响应式样式 */
@media (max-width: 768px) {
  .el-form-item {
    margin-bottom: 15px;
  }
  
  .el-form-item__label {
    padding: 0;
    margin-bottom: 5px;
    line-height: 1.2;
  }
}
</style>
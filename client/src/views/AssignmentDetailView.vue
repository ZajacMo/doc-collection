<template>
  <div class="assignment-detail-container">
          <!-- 返回按钮 -->
          <div class="back-button-container">
            <el-button type="text" @click="goBack">
              <i class="el-icon-arrow-left"></i>
              返回作业列表
            </el-button>
          </div>

          <!-- 加载状态 -->
          <div v-if="loading" class="loading-container">
            <el-icon class="is-loading"><Loading /></el-icon>
            <p>加载中...</p>
          </div>

          <!-- 作业详情卡片 -->
          <div v-else-if="assignment" class="assignment-detail-card">
            <!-- 作业标题和状态 -->
            <div class="assignment-header">
              <h1 class="assignment-title">{{ assignment.title }}</h1>
              <el-tag 
                v-if="userSubmission && userSubmission.status === 'submitted'"
                type="success"
                size="large"
              >
                已提交
              </el-tag>
              <el-tag 
                v-else-if="isAssignmentExpired(assignment.deadline)"
                type="danger"
                size="large"
              >
                已逾期
              </el-tag>
              <el-tag 
                v-else-if="isAssignmentUrgent(assignment.deadline)"
                type="warning"
                size="large"
              >
                紧急
              </el-tag>
              <el-tag 
                v-else
                type="info"
                size="large"
              >
                进行中
              </el-tag>
            </div>

            <!-- 作业基本信息 -->
            <div class="assignment-info">
              <div class="info-row">
                <div class="info-label">创建时间：</div>
                <div class="info-value">{{ formatDate(assignment.createTime) }}</div>
              </div>
              <div class="info-row">
                <div class="info-label">截止日期：</div>
                <div class="info-value" :class="{
                  'text-danger': isAssignmentExpired(assignment.deadline),
                  'text-warning': isAssignmentUrgent(assignment.deadline)
                }">
                  {{ formatDate(assignment.deadline) }}
                  <span v-if="!isAssignmentExpired(assignment.deadline)" class="countdown">
                    （剩余：{{ getCountdown(assignment.deadline) }}）
                  </span>
                </div>
              </div>
              <div class="info-row">
                <div class="info-label">创建者：</div>
                <div class="info-value">{{ assignment.creator || '管理员' }}</div>
              </div>
            </div>

            <!-- 作业描述 -->
            <div class="assignment-description">
              <h3>作业描述</h3>
              <p>{{ assignment.description || '暂无描述' }}</p>
            </div>

            <!-- 文件命名规则 -->
            <div class="naming-rule-section">
              <h3>文件命名规则</h3>
              <div class="naming-rule-container">
                <pre>{{ assignment.namingRule }}</pre>
                <div class="rule-tips">
                  <p>⚠️ 请严格按照此规则命名文件，否则无法提交！</p>
                  <p>支持的变量：{学号}, {姓名}, {作业名称}, {提交日期}</p>
                </div>
              </div>
            </div>

            <!-- 允许的文件类型 -->
            <div class="file-types-section">
              <h3>允许的文件类型</h3>
              <div class="file-types">
                <el-tag 
                  v-for="type in assignment.fileTypes" 
                  :key="type" 
                  type="info"
                >
                  {{ type.toUpperCase() }}
                </el-tag>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="action-buttons">
              <el-button 
                v-if="!isAssignmentExpired(assignment.deadline) && (!userSubmission || userSubmission.status !== 'submitted')"
                type="primary" 
                size="large"
                @click="goToSubmit"
              >
                <i class="el-icon-upload2"></i>
                提交作业
              </el-button>
              <el-button 
                v-else-if="userSubmission && userSubmission.status === 'submitted'"
                type="success" 
                size="large"
                @click="downloadMyFile"
              >
                <i class="el-icon-download"></i>
                下载我的作业
              </el-button>
              <el-button 
                v-if="userInfo?.role == 'admin'"
                type="warning" 
                size="large"
                @click="showUpdateDialog"
              >
                <i class="el-icon-edit"></i>
                编辑作业
              </el-button>
            </div>
          </div>

          <!-- 提交情况统计 -->
          <div v-if="assignment && userInfo?.role === 'admin'" class="submission-stats">
            <h3>提交情况统计</h3>
            <div class="stats-cards">
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-number">{{ totalStudents }}</div>
                  <div class="stat-label">总人数</div>
                </div>
              </el-card>
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-number">{{ submittedCount }}</div>
                  <div class="stat-label">已提交</div>
                  <div class="stat-percentage">{{ submittedPercentage }}%</div>
                </div>
              </el-card>
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-number">{{ pendingCount }}</div>
                  <div class="stat-label">未提交</div>
                  <div class="stat-percentage">{{ pendingPercentage }}%</div>
                </div>
              </el-card>
            </div>
          </div>

          <!-- 提交列表 -->
          <div 
            v-if="assignment && ((userInfo?.role === 'admin' && submissionList.length > 0) || 
                              (userSubmission && userInfo?.role !== 'admin'))"
            class="submission-list"
          >
            <h3>{{ userInfo?.role === 'admin' ? '提交列表' : '我的提交记录' }}</h3>
            <el-table 
              :data="userInfo?.role === 'admin' ? submissionList : [userSubmission]" 
              style="width: 100%"
              stripe
              border
              max-height="600"
            >
              <el-table-column type="index" label="序号" min-width="60"></el-table-column>
              <el-table-column prop="studentId" label="学号" min-width="100"></el-table-column>
              <el-table-column prop="studentName" label="姓名" min-width="80"></el-table-column>
              <el-table-column prop="submitTime" label="提交时间" min-width="140">
                <template #default="scope">
                  {{ scope && scope.row ? formatDate(scope.row.submitTime) : '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="fileName" label="文件名" min-width="180"></el-table-column>
              <el-table-column prop="fileSize" label="文件大小" min-width="80">
                <template #default="scope">
                  {{ scope && scope.row ? formatFileSize(scope.row.fileSize) : '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" min-width="80">
                <template #default="scope">
                  <el-tag v-if="scope && scope.row && scope.row.status === 'submitted'" type="success">已提交</el-tag>
                  <el-tag v-else-if="scope && scope.row && scope.row.status === 'late'" type="danger">已逾期</el-tag>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" min-width="120" fixed="right">
                <template #default="scope">
                  <el-button 
                    v-if="scope && scope.row && scope.row.fileId"
                    type="primary" 
                    size="small" 
                    @click="downloadFile(scope.row.fileId, scope.row.fileName)"
                  >
                    下载
                  </el-button>
                  <el-button 
                    v-if="userInfo?.role === 'admin' && scope && scope.row && scope.row.id"
                    type="danger" 
                    size="small" 
                    @click="deleteSubmission(scope.row.id)"
                  >
                    删除
                  </el-button>
                  <span v-if="!(scope && scope.row)">-</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
    <!-- 复用的作业编辑对话框组件 -->
    <AssignmentFormDialog
      v-model:visible="updateDialogVisible"
      :assignment="assignment"
      dialog-type="update"
      @submit="handleUpdateAssignment"
    />
    
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AssignmentFormDialog from '../components/AssignmentFormDialog.vue';
import { ElMessage, ElMessageBox, ElLoading, ElIcon } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import { getCurrentUser, logoutUser } from '../services/userService';
import { 
  getAssignmentById, 
  updateAssignment, 
  isAssignmentExpired 
} from '../services/assignmentService';
import { 
  getSubmissionsByAssignment, 
  getSubmissionByUserAndAssignment, 
  deleteSubmission, 
  downloadFile as downloadFileAPI 
} from '../services/submissionService';

export default {
  name: 'AssignmentDetailView',
  components: {
    AssignmentFormDialog
  },
  setup() {
    const userInfo = ref(getCurrentUser());
    const assignment = ref(null);
    const userSubmission = ref(null);
    const submissionList = ref([]);
    const allStudents = ref(0);
    const loading = ref(true);
    const updateDialogVisible = ref(false);
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };
    
    // 检查作业是否紧急（24小时内截止）
    const isAssignmentUrgent = (deadline) => {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const diff = deadlineDate - now;
      return diff > 0 && diff < 24 * 60 * 60 * 1000;
    };
    
    // 计算剩余时间
    const getCountdown = (deadline) => {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const diff = deadlineDate - now;
      
      if (diff <= 0) return '已逾期';
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        return `${days}天${hours}小时`;
      } else if (hours > 0) {
        return `${hours}小时${minutes}分钟`;
      } else {
        return `${minutes}分钟`;
      }
    };
    
    // 格式化文件大小
    const formatFileSize = (bytes) => {
      if (!bytes) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    // 计算提交统计
    const totalStudents = computed(() => allStudents.value);
    const submittedCount = computed(() => submissionList.value.length);
    const pendingCount = computed(() => totalStudents.value - submittedCount.value);
    const submittedPercentage = computed(() => 
      totalStudents.value > 0 ? Math.round((submittedCount.value / totalStudents.value) * 100) : 0
    );
    const pendingPercentage = computed(() => 100 - submittedPercentage.value);
    
    // 使用Vue Router获取路由信息
    const route = useRoute();
    const router = useRouter();
    
    // 获取作业ID
    const getAssignmentIdFromUrl = () => {
      // 优先从route params获取作业ID，其次从query获取，最后从URL路径解析
      let assignmentId = route.params.id || route.query.id;
      
      // 如果都没有，则尝试从URL路径解析
      if (!assignmentId) {
        const pathSegments = window.location.pathname.split('/');
        assignmentId = pathSegments[pathSegments.length - 1];
      }
      
      console.log('Using assignmentId:', assignmentId);
      return assignmentId;
    };
    
    // 加载数据
    const loadData = async () => {
      try {
        loading.value = true;
        
        // 直接从route params获取ID，这是最可靠的方式
        let assignmentId = route.params.id;
        
        console.log('Route params id:', assignmentId);
        
        // 验证assignmentId是否有效
        if (!assignmentId || assignmentId.trim() === '') {
          throw new Error('无效的作业ID');
        }
        
        // 确保ID是字符串类型
        assignmentId = String(assignmentId);
        console.log('Validated assignmentId:', assignmentId);
        
        // 获取作业详情
        const assignmentData = await getAssignmentById(assignmentId);
        assignment.value = assignmentData;
        
        // 加载用户提交记录 - 使用用户的id字段而不是studentId
        const userSubmissionData = await getSubmissionByUserAndAssignment(userInfo.value.id, assignmentId);
        userSubmission.value = userSubmissionData;
        
        // 如果是管理员，获取所有提交记录和学生总数
        if (userInfo.value.role === 'admin') {
          const submissionListData = await getSubmissionsByAssignment(assignmentId);
          submissionList.value = submissionListData || [];
          
          // 假设总人数是从Excel加载的用户数
          // 这里简化处理，实际应该从后端获取
          allStudents.value = 50; // 示例值
        }
        
      } catch (error) {
        ElMessage.error('加载作业详情失败');
        console.error('加载作业详情失败:', error);
      } finally {
        loading.value = false;
      }
    };
    
    // 返回作业列表
    const goBack = () => {
      router.push('/assignments');
    };
    
    // 跳转到提交页面
    const goToSubmit = () => {
      router.push(`/submit/${getAssignmentIdFromUrl()}`);
    };
    
    // 跳转到个人中心
    const goToProfile = () => {
      router.push('/profile');
    };
    
    // 退出登录
    const handleLogout = () => {
      logoutUser();
    };
    
    // 显示编辑作业对话框
    const showUpdateDialog = () => {
      // 直接打开对话框，组件内部会处理表单数据的初始化
      if (assignment.value) {
        updateDialogVisible.value = true;
      } else {
        ElMessage.warning('作业数据未加载完成，请稍后再试');
      }
    };
    
    // 处理更新作业
    const handleUpdateAssignment = async (formData) => {
      try {
        // 调用更新作业接口
        const assignmentId = getAssignmentIdFromUrl();
        await updateAssignment(assignmentId, formData);
        
        ElMessage.success('作业更新成功');
        updateDialogVisible.value = false;
        
        // 重新加载数据
        loadData();
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '更新作业失败');
        console.error('更新作业失败:', error);
      }
    };
    
    // 下载文件
    const downloadFile = async (fileId, fileName) => {
      try {
        await downloadFileAPI(fileId, fileName);
      } catch (error) {
        ElMessage.error('文件下载失败');
        console.error('文件下载失败:', error);
      }
    };
    
    // 下载我的文件
    const downloadMyFile = () => {
      if (userSubmission.value) {
        downloadFile(userSubmission.value.fileId, userSubmission.value.fileName);
      }
    };
    
    // 删除提交
    const deleteSubmission = async (submissionId) => {
      try {
        await ElMessageBox.confirm(
          '确定要删除此提交记录吗？删除后将无法恢复。',
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        
        // 调用删除接口
        await deleteSubmission(submissionId);
        
        ElMessage.success('提交记录删除成功');
        
        // 重新加载数据
        loadData();
      } catch (error) {
        // 用户取消删除不会抛出错误，只有真正的错误才会显示提示
        if (error !== 'cancel') {
          ElMessage.error(error.response?.data?.message || '删除提交记录失败');
          console.error('删除提交记录失败:', error);
        }
      }
    };
    
    // 组件挂载时加载数据
    onMounted(() => {
      loadData();
    });
    
    return {
      userInfo,
      assignment,
      userSubmission,
      submissionList,
      loading,
      updateDialogVisible,
      totalStudents,
      submittedCount,
      pendingCount,
      submittedPercentage,
      pendingPercentage,
      formatDate,
      isAssignmentExpired,
      isAssignmentUrgent,
      getCountdown,
      formatFileSize,
      goBack,
      goToSubmit,
      goToProfile,
      handleLogout,
      showUpdateDialog,
      handleUpdateAssignment,
      downloadFile,
      downloadMyFile,
      deleteSubmission
    };
  }
};
</script>

<style scoped>
.assignment-detail-container {
  background-color: #f5f7fa;
  padding: 20px;
  width: 100%;
  min-height: calc(100vh - 60px); /* 考虑Header高度 */
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

.assignment-detail-card {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.assignment-title {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin: 0;
  flex: 1;
  margin-right: 20px;
}

.assignment-info {
  margin-bottom: 30px;
}

.info-row {
  display: flex;
  margin-bottom: 15px;
  align-items: center;
}

.info-label {
  width: 100px;
  color: #606266;
  font-weight: bold;
}

.info-value {
  color: #303133;
  font-size: 15px;
}

.countdown {
  font-size: 13px;
  color: #909399;
  margin-left: 10px;
}

.assignment-description {
  margin-bottom: 30px;
}

.assignment-description h3 {
  color: #303133;
  margin-bottom: 15px;
  font-size: 18px;
}

.assignment-description p {
  color: #606266;
  line-height: 1.8;
  font-size: 15px;
  white-space: pre-wrap;
}

.naming-rule-section {
  margin-bottom: 30px;
}

.naming-rule-section h3 {
  color: #303133;
  margin-bottom: 15px;
  font-size: 18px;
}

.naming-rule-container {
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
  border-left: 4px solid #e6a23c;
}

.naming-rule-container pre {
  background-color: transparent;
  border: none;
  padding: 0;
  margin: 0;
  font-family: 'Courier New', Courier, monospace;
  font-size: 16px;
  color: #e6a23c;
  font-weight: bold;
}

.rule-tips {
  margin-top: 10px;
}

.rule-tips p {
  margin: 5px 0;
  font-size: 13px;
  color: #909399;
}

.file-types-section {
  margin-bottom: 30px;
}

.file-types-section h3 {
  color: #303133;
  margin-bottom: 15px;
  font-size: 18px;
}

.file-types {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.submission-stats {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.submission-stats h3 {
  color: #303133;
  margin-bottom: 20px;
  font-size: 18px;
}

.stats-cards {
  display: flex;
  gap: 20px;
}

.stat-card {
  flex: 1;
  min-width: 200px;
}

.stat-content {
  text-align: center;
}

.stat-number {
  font-size: 36px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 16px;
  color: #606266;
  margin-bottom: 5px;
}

.stat-percentage {
  font-size: 14px;
  color: #909399;
}

.submission-list {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
}

.submission-list h3 {
  color: #303133;
  margin-bottom: 20px;
  font-size: 18px;
}

.text-danger {
  color: #f56c6c;
}

.text-warning {
  color: #e6a23c;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .assignment-detail-card,
  .submission-stats,
  .submission-list {
    padding: 20px 15px;
  }
  
  .assignment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 10px;
  }
  
  .action-buttons .el-button {
    width: 100%;
  }
  
  .el-table {
    overflow-x: auto;
  }
  
  .naming-rule-container {
    padding: 10px;
  }
  
  .naming-rule-container pre {
    font-size: 14px;
    white-space: pre-wrap;
    word-break: break-all;
  }
}
</style>
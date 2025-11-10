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
      <AssignmentHeader 
        :assignment="assignment" 
        :status="assignmentStatus"
      />

      <!-- 作业基本信息 -->
      <AssignmentInfo :assignment="assignment" />

      <!-- 作业描述 -->
      <AssignmentDescription :assignment="assignment" />

      <!-- 提交作业表单 - 仅当用户未提交且作业未过期时显示 -->
      <SubmissionForm 
        v-if="!userSubmission && !isAssignmentExpired(assignment.deadline)" 
        :assignment-id="assignment.id"
        :assignment-name="assignment.title"
        :is-assignment-expired="isAssignmentExpired(assignment.deadline)"
        @submission-success="loadData"
      />
      
      <!-- 已提交作业状态卡片 - 当用户已提交作业时显示 -->
          <SubmittedStatusCard 
            v-else-if="userSubmission" 
            :user-submission="userSubmission"
            :status="assignmentStatus"
            :is-assignment-expired="isAssignmentExpired(assignment.deadline)"
            @download="downloadMyFile"
          />
      
      <!-- 作业状态通知提示 - 根据assignmentStatus动态显示 -->
      <NoticeCard 
        :assignment-status="assignmentStatus"
      />

      <!-- 操作按钮 - 仅保留管理员操作 -->
      <div class="action-buttons">
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
    <SubmissionStats 
      v-if="assignment && userInfo?.role === 'admin'" 
      :total-students="allStudents"
      :submitted-count="submissionList.length"
    />

    <!-- 提交列表 -->
    <SubmissionList 
      v-if="assignment && ((userInfo?.role === 'admin' && submissionList.length > 0) || 
                         (userSubmission && userInfo?.role !== 'admin'))"
      :submission-list="submissionList"
      :user-submission="userSubmission"
      :is-admin="userInfo?.role === 'admin'"
      @download="downloadFile"
      @delete="deleteSubmission"
    />
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
import AssignmentHeader from '../components/AssignmentDetail/AssignmentHeader.vue';
import AssignmentInfo from '../components/AssignmentDetail/AssignmentInfo.vue';
import AssignmentDescription from '../components/AssignmentDetail/AssignmentDescription.vue';
import SubmissionForm from '../components/AssignmentDetail/SubmissionForm.vue';
import SubmittedStatusCard from '../components/AssignmentDetail/SubmittedStatusCard.vue';
import NoticeCard from '../components/AssignmentDetail/NoticeCard.vue';
import SubmissionStats from '../components/AssignmentDetail/SubmissionStats.vue';
import SubmissionList from '../components/SubmissionList.vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import { getCurrentUserInfo, logoutUser, getAllUsers } from '../services/userService';
import { 
  getAssignmentById, 
  updateAssignment, 
  isAssignmentExpired as checkAssignmentExpired
} from '../services/assignmentService';
import { 
  getSubmissionsByAssignment, 
  getSubmissionByUserAndAssignment, 
  deleteSubmission as deleteSubmissionAPI, 
  downloadFile as downloadFileAPI,
  getStudentSubmissionStatus
} from '../services/submissionService';

export default {
  name: 'AssignmentDetailView',
  components: {
    AssignmentFormDialog,
    AssignmentHeader,
    AssignmentInfo,
    AssignmentDescription,
    SubmissionForm,
    SubmittedStatusCard,
    NoticeCard,
    SubmissionStats,
    SubmissionList
  },
  setup() {
    const userInfo = ref(getCurrentUserInfo());
    const assignment = ref(null);
    const userSubmission = ref(null);
    const submissionList = ref([]);
    const allStudents = ref(0);
    const loading = ref(true);
    const updateDialogVisible = ref(false);
    // 使用计算属性assignmentStatus代替单独的submissionStatus变量
    
    // 检查作业是否已过期
    const isAssignmentExpired = (deadline) => {
      return checkAssignmentExpired(deadline);
    };
    
    // 检查作业是否紧急（24小时内截止）
    const isAssignmentUrgent = (deadline) => {
      if (!deadline) return false;
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const diff = deadlineDate - now;
      return diff > 0 && diff < 24 * 60 * 60 * 1000;
    };
    
    // 计算作业状态
    const assignmentStatus = computed(() => {
      if (!assignment.value) return 'in_progress';
      
      // 使用userSubmission的状态（已包含从API获取的状态）
      if (userSubmission.value) {
        if (userSubmission.value.status === 'submitted') {
          return 'submitted';
        } else if (userSubmission.value.status === 'late') {
          return 'late';
        }
      }
      
      // 检查截止日期相关状态
      if (isAssignmentExpired(assignment.value.deadline)) {
        return 'expired';
      } else if (isAssignmentUrgent(assignment.value.deadline)) {
        return 'urgent';
      }
      
      // 默认状态
      return 'in_progress';
    });
    
    // 使用Vue Router获取路由信息
    const route = useRoute();
    const router = useRouter();
    
    // 移除了已移至SubmissionForm组件的提交作业相关方法
    // 移除了formatDate、formatFileSize等已移至各组件的辅助函数
    
    // 获取作业ID
    const getAssignmentIdFromUrl = () => {
      // 优先从route params获取作业ID，其次从query获取
      let assignmentId = route.params.id || route.query.id;
      
      console.log('Using assignmentId:', assignmentId);
      return assignmentId;
    };
    
    // 加载数据
    const loadData = async () => {
      try {
        loading.value = true;
        
        // 直接从route params获取ID，这是最可靠的方式
        let assignmentId = route.params.id;
        
        // 验证assignmentId是否有效
        if (!assignmentId || assignmentId.trim() === '') {
          throw new Error('无效的作业ID');
        }
        
        // 确保ID是字符串类型
        assignmentId = String(assignmentId);
        
        // 获取作业详情
        const assignmentData = await getAssignmentById(assignmentId);
        assignment.value = assignmentData;
        
        // 使用getCurrentUserInfo获取正确的用户信息
        const currentUserInfo = getCurrentUserInfo();
        console.log('Current User Info:', currentUserInfo);
        
        // 修正：getCurrentUserInfo直接返回用户对象，不需要访问.user属性
        const userIdFromUserData = currentUserInfo?.studentId;
        const userIdFromLocalStorage = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).user?.studentId : null;
        
        // 获取学生ID（用于提交状态查询）
        const studentId = userIdFromUserData || userIdFromLocalStorage;
        
        // 保存到localStorage以便下次使用
        if (studentId) {
          localStorage.setItem('studentId', studentId);
        }
        const studentName = currentUserInfo?.name || (localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).user?.name : '');
        if (studentName) {
          localStorage.setItem('studentName', studentName);
        }
        
        // 加载用户提交记录 - 使用用户ID进行查询，这是API期望的参数
        // 从用户数据中获取正确的用户ID
        const userId = currentUserInfo?.id || (localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).user?.id : null);
        
        if (userId) {
          const userSubmissionData = await getSubmissionByUserAndAssignment(userId, assignmentId);
          userSubmission.value = userSubmissionData;
          console.log('Loaded user submission:', userSubmission.value);
          
          // 调用新的API获取学生提交状态 - 结果会被assignmentStatus计算属性使用
          try {
            // 使用前面定义的studentId或userId
            const statusStudentId = studentId || userId;
            const statusData = await getStudentSubmissionStatus(statusStudentId, assignmentId);
            // 保存原始提交记录状态，供assignmentStatus计算属性使用
            if (statusData) {
              // 如果获取到了状态数据，更新userSubmission的状态
              if (userSubmission.value) {
                userSubmission.value.status = statusData?.status || statusData;
              }
              console.log('Loaded submission status:', statusData?.status || statusData);
            }
          } catch (error) {
            console.error('获取学生提交状态失败:', error);
            // 如果API调用失败，可以保持现有的逻辑作为后备
          }
        } else {
          console.error('无法获取用户ID，无法加载提交记录');
        }
        
        // 如果是管理员，获取所有提交记录和学生总数
        if (currentUserInfo?.role === 'admin') {
          const submissionListData = await getSubmissionsByAssignment(assignmentId);
          submissionList.value = submissionListData || [];
          
          // 获取所有用户，然后过滤出学生角色的总数
          try {
            const allUsersData = await getAllUsers();
            if (Array.isArray(allUsersData)) {
              // 过滤出角色为'student'的用户数量
              const studentCount = allUsersData.filter(user => user.role === 'student').length;
              allStudents.value = studentCount;
              console.log('AssignmentDetailView - 学生总数:', studentCount);
            } else {
              console.error('AssignmentDetailView - 获取用户列表失败，数据格式错误');
              allStudents.value = 0;
            }
          } catch (error) {
            console.error('AssignmentDetailView - 获取学生总数失败:', error);
            allStudents.value = 0;
          }
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
    
    // goToSubmit函数已移除，因为提交按钮已删除
    
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
        await deleteSubmissionAPI(submissionId);
        
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
    
    // 在控制台输出userSubmission的值
    console.log('userSubmission:', userSubmission);
    
    return {
      userInfo,
      assignment,
      userSubmission,

      submissionList,
      allStudents,
      loading,
      updateDialogVisible,
      isAssignmentExpired,
      assignmentStatus,
      goBack,
      goToProfile,
      handleLogout,
      showUpdateDialog,
      handleUpdateAssignment,
      downloadFile,
      downloadMyFile,
      deleteSubmission
    };
  }
}
</script>

<style scoped>
.assignment-detail-container {
  background-color: #f5f7fa;
  padding: 20px;
  width: 100%;
  min-height: calc(100vh - 60px); /* 考虑Header高度 */
  overflow: auto;
}

/* 新增：提交表单相关样式 */
.submit-form-container {
  max-width: 800px;
  margin: 20px auto 0;
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

.submit-form-card {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 20px;
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

/* 文件命名规则相关样式已移除 */

/* 文件类型相关样式已移除 */

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
  
  /* 响应式文件命名规则样式已移除 */
}
</style>
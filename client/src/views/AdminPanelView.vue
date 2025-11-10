<template>
<!-- 需要在script部分导入这些图标 -->
  <div class="admin-panel-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>管理中心</h2>
    </div>

    <!-- 管理选项卡 -->
    <el-tabs v-model="activeTab" type="border-card" style="width: 100%">
      <!-- 系统概览 -->
      <el-tab-pane label="系统概览" name="overview">
        <overview-section 
          :total-users="totalUsers" 
          :total-assignments="totalAssignments"
          :total-submissions="totalSubmissions"
          :pending-assignments="pendingAssignments"
          :recent-activities-data="recentActivitiesData"
        />
      </el-tab-pane>

      <!-- 用户管理 -->
      <el-tab-pane label="用户管理" name="users">
        <user-management 
          :all-users="allUsers"
          @show-import-dialog="importUserDialogVisible = true"
          @show-add-dialog="addUserDialogVisible = true"
          @edit-user="editUser"
          @delete-user="deleteUser"
        />
      </el-tab-pane>

      <!-- 作业管理 -->
      <el-tab-pane label="作业管理" name="assignments">
        <assignment-management 
          :all-assignments="allAssignments"
          @show-create-dialog="createAssignmentDialogVisible = true"
          @view-detail="goToAssignmentDetail"
          @delete-assignment="deleteAssignment"
        />
      </el-tab-pane>

      <!-- 提交管理 -->
      <el-tab-pane label="提交管理" name="submissions">
        <submission-management 
          :all-submissions="allSubmissions"
          :all-assignments="allAssignments"
          @download-file="downloadSubmissionFile"
          @delete-submission="deleteSubmission"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- 对话框组件 -->
    <DialogComponents
      v-model:import-dialog-visible="importUserDialogVisible"
      v-model:add-dialog-visible="addUserDialogVisible"
      v-model:edit-dialog-visible="editUserDialogVisible"
      v-model:create-assignment-dialog-visible="createAssignmentDialogVisible"
      :edit-user-data="currentEditUser"
      @data-updated="loadData"
    ></DialogComponents>
  </div>
</template>

<script>
import { User, SwitchButton } from '@element-plus/icons-vue';
import UserDropdown from '../components/UserDropdown.vue';
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getCurrentUser, logoutUser, getAllUsers, deleteUser as deleteUserAPI } from '../services/userService';
import { getAllAssignments, deleteAssignment as deleteAssignmentAPI } from '../services/assignmentService';
import { getAllSubmissions, deleteSubmission as deleteSubmissionAPI, downloadFile, handleFileDownload } from '../services/submissionService';

// 导入子组件
import OverviewSection from '../components/admin/OverviewSection.vue';
import UserManagement from '../components/admin/UserManagement.vue';
import AssignmentManagement from '../components/admin/AssignmentManagement.vue';
import SubmissionManagement from '../components/admin/SubmissionManagement.vue';
import DialogComponents from '../components/admin/DialogComponents.vue';

/**
 * 管理中心主视图组件
 * 负责整合各个子管理模块，处理数据加载和全局状态管理
 */
export default {
  name: 'AdminPanelView',
  components: {
    User,
    SwitchButton,
    UserDropdown,
    OverviewSection,
    UserManagement,
    AssignmentManagement,
    SubmissionManagement,
    DialogComponents
  },
  setup() {
    const router = useRouter();
    const userInfo = ref(getCurrentUser());
    const activeTab = ref('overview');
    const allUsers = ref([]);
    const allAssignments = ref([]);
    const allSubmissions = ref([]);
    const recentActivitiesData = ref([]);
    
    // 对话框状态
    const importUserDialogVisible = ref(false);
    const addUserDialogVisible = ref(false);
    const editUserDialogVisible = ref(false);
    const createAssignmentDialogVisible = ref(false);
    const currentEditUser = ref(null);
    
    // 系统概览数据
    const totalUsers = computed(() => allUsers.value.length);
    const totalAssignments = computed(() => allAssignments.value.length);
    const totalSubmissions = computed(() => allSubmissions.value.length);
    const pendingAssignments = computed(() => {
      const now = new Date();
      return allAssignments.value.filter(a => new Date(a.deadline) > now).length;
    });
    
    // 加载数据
    const loadData = async () => {
      try {
        // 获取所有用户
        const usersData = await getAllUsers();
        allUsers.value = Array.isArray(usersData) ? usersData : [];
        
        // 获取所有作业
        const assignmentsData = await getAllAssignments();
        allAssignments.value = Array.isArray(assignmentsData) ? assignmentsData : [];
        
        // 获取所有提交并添加作业标题
        const submissionsData = await getAllSubmissions();
        if (Array.isArray(submissionsData)) {
          allSubmissions.value = submissionsData.map(submission => {
            const assignment = allAssignments.value.find(a => a.id === submission.assignmentId);
            return {
              ...submission,
              assignmentTitle: assignment?.title || '未知作业'
            };
          });
        } else {
          allSubmissions.value = [];
        }
        
        // 生成近期活动数据
        generateRecentActivities();
        
      } catch (error) {
        ElMessage.error('加载数据失败');
        console.error('加载数据失败:', error);
        // 确保数据始终是数组，防止表格渲染错误
        allUsers.value = [];
        allAssignments.value = [];
        allSubmissions.value = [];
      }
    };
    
    // 生成近期活动数据
    const generateRecentActivities = () => {
      const activities = [];
      
      // 安全处理用户提交作业
      if (Array.isArray(allSubmissions.value) && allSubmissions.value.length > 0) {
        const recentSubmissions = [...allSubmissions.value]
          .filter(submission => submission && submission.submitTime && submission.studentName)
          .sort((a, b) => new Date(b.submitTime) - new Date(a.submitTime))
          .slice(0, 10);
        
        recentSubmissions.forEach(submission => {
          activities.push({
            time: submission.submitTime,
            user: submission.studentName,
            action: '提交了作业',
            details: submission.assignmentTitle || '未知作业'
          });
        });
      }
      
      // 安全处理创建作业
      if (Array.isArray(allAssignments.value) && allAssignments.value.length > 0) {
        const recentAssignments = [...allAssignments.value]
          .filter(assignment => assignment && assignment.createTime && assignment.title)
          .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
          .slice(0, 5);
        
        recentAssignments.forEach(assignment => {
          activities.push({
            time: assignment.createTime,
            user: assignment.creator || '管理员',
            action: '创建了作业',
            details: assignment.title
          });
        });
      }
      
      // 按时间排序并确保数据安全
      recentActivitiesData.value = activities
        .filter(activity => activity && activity.time)
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 15);
    };
    
    // 退出登录
    const handleLogout = async () => {
      try {
        await logoutUser();
        router.push('/login');
      } catch (error) {
        ElMessage.error('退出登录失败');
      }
    };
    
    // 跳转到个人中心
    const goToProfile = () => {
      router.push('/profile');
    };
    
    // 跳转到作业详情
    const goToAssignmentDetail = (assignmentId) => {
      window.location.href = `/assignments/${assignmentId}`;
    };
    
    // 编辑用户
    const editUser = (user) => {
      currentEditUser.value = { ...user };
      editUserDialogVisible.value = true;
    };
    
    // 删除用户
    const deleteUser = async (studentId, userName) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除用户「${userName}」吗？删除后将无法恢复。`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        
        // 调用删除接口
        await deleteUserAPI(studentId);
        
        ElMessage.success('用户删除成功');
        
        // 重新加载数据
        loadData();
      } catch (error) {
        // 用户取消删除不会抛出错误，只有真正的错误才会显示提示
        if (error !== 'cancel') {
          ElMessage.error(error.response?.data?.message || '用户删除失败');
          console.error('用户删除失败:', error);
        }
      }
    };
    
    // 删除作业
    const deleteAssignment = async (assignmentId, assignmentTitle) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除作业「${assignmentTitle}」吗？删除后将无法恢复。`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        
        // 调用删除接口
        await deleteAssignmentAPI(assignmentId);
        
        ElMessage.success('作业删除成功');
        
        // 重新加载数据
        loadData();
      } catch (error) {
        // 用户取消删除不会抛出错误，只有真正的错误才会显示提示
        if (error !== 'cancel') {
          ElMessage.error(error.response?.data?.message || '作业删除失败');
          console.error('作业删除失败:', error);
        }
      }
    };
    
    // 下载提交文件
    const downloadSubmissionFile = async (fileId, fileName) => {
      try {
        // 调用downloadFile只传递submission ID
        const response = await downloadFile(fileId);
        // 使用handleFileDownload处理blob响应并触发下载
        handleFileDownload(response.data, fileName);
        ElMessage.success(`文件「${fileName}」下载成功`);
      } catch (error) {
        ElMessage.error('文件下载失败');
        console.error('文件下载失败:', error);
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
          ElMessage.error(error.response?.data?.message || '提交记录删除失败');
          console.error('提交记录删除失败:', error);
        }
      }
    };
    
    // 组件挂载时加载数据
    onMounted(() => {
      loadData();
    });
    
    return {
      User,
      SwitchButton,
      UserDropdown,
      userInfo,
      activeTab,
      allUsers,
      allAssignments,
      allSubmissions,
      recentActivitiesData,
      importUserDialogVisible,
      addUserDialogVisible,
      editUserDialogVisible,
      createAssignmentDialogVisible,
      currentEditUser,
      totalUsers,
      totalAssignments,
      totalSubmissions,
      pendingAssignments,
      loadData,
      handleLogout,
      goToProfile,
      goToAssignmentDetail,
      editUser,
      deleteUser,
      deleteAssignment,
      downloadSubmissionFile,
      deleteSubmission
    };
  }
};
</script>

<style scoped>
.admin-panel-container {
  padding: 20px;
  width: 100%;
  height: calc(100vh - 60px);
  margin: 0;
  overflow: auto;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

/* 系统概览部分样式 */
.overview-section {
  margin-bottom: 20px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.overview-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.overview-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.overview-content {
  display: flex;
  align-items: center;
}

.overview-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.overview-icon i {
  color: white;
  font-size: 24px;
}

.overview-info {
  flex: 1;
}

.overview-number {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 5px;
}

.overview-label {
  font-size: 14px;
  color: #909399;
}

.recent-activities h3 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 15px 0;
}

/* 用户管理部分样式 */
.user-management .user-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.user-management .user-search {
  margin-bottom: 15px;
}

.user-management .user-pagination {
  margin-top: 15px;
  text-align: right;
}

/* 作业管理部分样式 */
.assignment-management .assignment-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.assignment-management .assignment-search {
  margin-bottom: 15px;
}

.assignment-management .assignment-pagination {
  margin-top: 15px;
  text-align: right;
}

/* 提交管理部分样式 */
.submission-management .submission-filter {
  margin-bottom: 15px;
}

.submission-management .submission-pagination {
  margin-top: 15px;
  text-align: right;
}

/* 对话框样式 */
.upload-excel {
  margin-bottom: 15px;
}

.import-template {
  margin-bottom: 15px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .admin-panel-container {
    padding: 10px;
  }
  
  .overview-cards {
    grid-template-columns: 1fr;
  }
  
  .user-actions,
  .assignment-actions {
    flex-direction: column;
  }
}
</style>
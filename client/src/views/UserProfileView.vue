<template>
  <div class="user-profile-container">
        <!-- 内容区域 -->
          <!-- 页面标题 -->
          <div class="page-header">
            <h2>个人中心</h2>
          </div>

          <!-- 加载状态 -->
          <div v-if="loading" class="loading-container">
            <el-icon class="loading-icon"><Loading /></el-icon>
            <p>加载中...</p>
          </div>

          <!-- 个人信息卡片 -->
          <div v-else class="user-info-card">
            <el-card class="info-card">
              <div class="info-header">
                <div class="avatar-container">
                  <el-avatar style="width: 120px; height: 120px; line-height: 120px; font-size: 48px;" class="user-avatar">
                    {{ userInfo?.name?.charAt(0) || '用' }}
                  </el-avatar>
                </div>
                <div class="user-basic-info">
                  <h3 class="user-name">{{ userInfo?.name || '未知用户' }}</h3>
                  <div class="user-role">
                    <el-tag 
                      v-if="userInfo?.role === 'admin'"
                      type="danger"
                      size="small"
                    >
                      管理员
                    </el-tag>
                    <el-tag 
                      v-else
                      type="primary"
                      size="small"
                    >
                      学生
                    </el-tag>
                  </div>
                </div>
              </div>

              <div class="info-details">
                <el-descriptions border :column="2" :size="'large'">
                  <el-descriptions-item label="学号">
                    {{ userInfo?.studentId || '无' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="姓名">
                    {{ userInfo?.name || '无' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="班级">
                    {{ userInfo?.class || '无' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="角色">
                    {{ userInfo?.role === 'admin' ? '管理员' : '学生' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="注册时间">
                    {{ formatDate(userInfo?.createTime) || '无' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="最后登录">
                    {{ formatDate(userInfo?.lastLogin) || '无' }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>

              <div class="action-buttons">
                <el-button @click="changePassword">修改密码</el-button>
              </div>
            </el-card>
          </div>

          <!-- 作业统计 -->
          <div class="assignment-stats">
            <h3>作业完成情况</h3>
            <div class="stats-cards">
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-icon">
                    <i class="el-icon-document-copy"></i>
                  </div>
                  <div class="stat-number">{{ totalAssignments }}</div>
                  <div class="stat-label">总作业数</div>
                </div>
              </el-card>
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-icon success">
                    <i class="el-icon-check"></i>
                  </div>
                  <div class="stat-number">{{ submittedAssignments }}</div>
                  <div class="stat-label">已提交</div>
                </div>
              </el-card>
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-icon danger">
                    <i class="el-icon-close"></i>
                  </div>
                  <div class="stat-number">{{ overdueAssignments }}</div>
                  <div class="stat-label">已逾期</div>
                </div>
              </el-card>
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-icon warning">
                    <i class="el-icon-time"></i>
                  </div>
                  <div class="stat-number">{{ pendingAssignments }}</div>
                  <div class="stat-label">待完成</div>
                </div>
              </el-card>
            </div>
          </div>

          <!-- 最近提交记录 -->
          <div class="recent-submissions">
            <h3>最近提交记录</h3>
            <el-table 
              :data="recentSubmissionsData" 
              style="width: 100%"
              stripe
              border
              max-height="600"
            >
              <el-table-column prop="assignmentTitle" label="作业名称" min-width="180"></el-table-column>
              <el-table-column prop="submitTime" label="提交时间" min-width="140">
                <template #default="scope">
                  {{ formatDate(scope.row.submitTime) }}
                </template>
              </el-table-column>
              <el-table-column prop="fileName" label="文件名" min-width="180"></el-table-column>
              <el-table-column prop="status" label="状态" min-width="80">
                <template #default="scope">
                  <el-tag 
                    v-if="scope.row.status === 'submitted'"
                    type="success"
                  >
                    已提交
                  </el-tag>
                  <el-tag 
                    v-if="scope.row.status === 'late'"
                    type="danger"
                  >
                    已逾期
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" min-width="100" fixed="right">
                <template #default="scope">
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="goToAssignmentDetail(scope.row.assignmentId)"
                  >
                    查看
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

    <!-- 修改密码对话框 -->

    <!-- 修改密码对话框 -->
    <el-dialog 
      title="修改密码" 
      :visible.sync="passwordDialogVisible"
      width="500px"
    >
      <el-form 
        ref="passwordFormRef" 
        :model="passwordForm" 
        :rules="passwordRules" 
        label-width="100px"
      >
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input v-model="passwordForm.currentPassword" type="password"></el-input>
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password"></el-input>
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleChangePassword">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import { getCurrentUser, logoutUser } from '../services/userService';
import { getAllAssignments } from '../services/assignmentService';
import { getSubmissionsByUser } from '../services/submissionService';

export default {
  name: 'UserProfileView',
  setup() {
    const userInfo = ref(getCurrentUser());
    const allAssignments = ref([]);
    const allSubmissions = ref([]);
    const recentSubmissionsData = ref([]);
    const loading = ref(true);
    const passwordDialogVisible = ref(false);
    const passwordFormRef = ref(null);
    
    const passwordForm = ref({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    
    const passwordRules = ref({
      currentPassword: [
        { required: true, message: '请输入当前密码', trigger: 'blur' }
      ],
      newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, max: 20, message: '密码长度在 6 到 20 个字符之间', trigger: 'blur' },
        { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$/, message: '密码必须包含字母和数字', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: '请确认新密码', trigger: 'blur' },
        {
          validator: (rule, value, callback) => {
            if (value !== passwordForm.value.newPassword) {
              callback(new Error('两次输入的密码不一致'));
            } else {
              callback();
            }
          },
          trigger: 'blur'
        }
      ]
    });
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };
    
    // 计算作业统计数据
    const totalAssignments = computed(() => allAssignments.value.length);
    const submittedAssignments = computed(() => allSubmissions.value.length);
    const overdueAssignments = computed(() => {
      // 这里需要根据作业截止日期计算逾期数量
      // 简化处理，实际应该更精确
      return allSubmissions.value.filter(s => s.status === 'late').length;
    });
    const pendingAssignments = computed(() => {
      // 待完成 = 总作业 - 已提交
      return totalAssignments.value - submittedAssignments.value;
    });
    
    // 加载数据
    const loadData = async () => {
      try {
        loading.value = true;
        
        // 获取当前用户信息
        const currentUser = getCurrentUser();
        userInfo.value = currentUser;
        
        // 初始化用户数据
        
        // 获取所有作业
        const assignmentsData = await getAllAssignments();
        allAssignments.value = assignmentsData || [];
        
        // 获取用户所有提交
        const submissionsData = await getSubmissionsByUser(currentUser.studentId);
        allSubmissions.value = submissionsData || [];
        
        // 获取最近的5条提交记录
        recentSubmissionsData.value = [...allSubmissions.value]
          .sort((a, b) => new Date(b.submitTime) - new Date(a.submitTime))
          .slice(0, 5)
          .map(submission => {
            // 查找对应的作业信息
            const assignment = allAssignments.value.find(a => a.id === submission.assignmentId);
            return {
              ...submission,
              assignmentTitle: assignment?.title || '未知作业'
            };
          });
          
      } catch (error) {
        ElMessage.error('加载数据失败');
        console.error('加载数据失败:', error);
      } finally {
        loading.value = false;
      }
    };
    
    // 退出登录
    const handleLogout = () => {
      logoutUser();
    };
    
    // 跳转到作业详情
    const goToAssignmentDetail = (assignmentId) => {
      window.location.href = `/assignments/${assignmentId}`;
    };
    
    // 跳转到个人中心
    const goToProfile = () => {
      window.location.href = '/profile';
    };
    

    
    // 显示修改密码对话框
    const changePassword = () => {
      passwordDialogVisible.value = true;
    };
    
    // 处理修改密码
    const handleChangePassword = async () => {
      try {
        // 表单验证
        await passwordFormRef.value.validate();
        
        // 这里需要调用修改密码的API
        // 目前后端还没有实现这个接口，这里简化处理
        
        ElMessage.success('密码修改成功，请重新登录');
        passwordDialogVisible.value = false;
        
        // 重置表单
        passwordForm.value = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
        
        // 跳转到登录页面
        setTimeout(() => {
          logoutUser();
        }, 1500);
        
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '密码修改失败');
        console.error('密码修改失败:', error);
      }
    };
    
    // 组件挂载时加载数据
    onMounted(() => {
      loadData();
    });
    
    return {
      userInfo,
      allAssignments,
      allSubmissions,
      recentSubmissionsData,
      loading,
      passwordDialogVisible,
      passwordFormRef,
      passwordForm,
      passwordRules,
      totalAssignments,
      submittedAssignments,
      overdueAssignments,
      pendingAssignments,
      formatDate,
      handleLogout,
      goToAssignmentDetail,
      goToProfile,
      changePassword,
      handleChangePassword
    };
  }
};
</script>

<style scoped>
.user-profile-container {
  background-color: #f5f7fa;
  padding: 20px;
  height: calc(100vh - 60px);
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  color: #303133;
  margin: 0;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
}

.loading-icon {
  font-size: 48px;
  color: #1890ff;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-icon {
  font-size: 48px;
  color: #1890ff;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.user-info-card {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 20px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .info-header {
    flex-direction: column;
    text-align: center;
  }
  
  .avatar-container {
    margin-right: 0;
    margin-bottom: 20px;
  }
  
  .user-info-card,
  .assignment-stats,
  .recent-submissions {
    padding: 20px 15px;
    width: 100%;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons .el-button {
    width: 100%;
    margin-bottom: 10px;
  }
  
  .el-table {
    width: 100%;
    overflow-x: auto;
  }
}

.info-header {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.avatar-container {
  margin-right: 30px;
}

.user-avatar {
  font-size: 48px;
  background-color: #1890ff;
}

.user-basic-info {
  flex: 1;
}

.user-name {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin: 0 0 10px 0;
}

.user-role {
  display: flex;
  align-items: center;
}

.info-details {
  margin-bottom: 30px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.assignment-stats {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.assignment-stats h3 {
  color: #303133;
  margin-bottom: 20px;
  font-size: 18px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  text-align: center;
  height: 120px;
}

.stat-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.stat-icon {
  font-size: 32px;
  color: #1890ff;
  margin-bottom: 10px;
}

.stat-icon.success {
  color: #67c23a;
}

.stat-icon.danger {
  color: #f56c6c;
}

.stat-icon.warning {
  color: #e6a23c;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.recent-submissions {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
}

.recent-submissions h3 {
  color: #303133;
  margin-bottom: 20px;
  font-size: 18px;
}
</style>
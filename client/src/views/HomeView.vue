<template>
  <div class="home-container">
    <el-container>
      <!-- 顶部导航栏 -->
      <el-header class="header">
        <div class="header-content">
          <div class="header-title">
            <i class="el-icon-document"></i>
            <span>作业收集系统</span>
          </div>
          <div class="header-user">
            <el-dropdown>
              <span class="el-dropdown-link">
                <i class="el-icon-user"></i>
                {{ userInfo?.name || '用户' }}
                <i class="el-icon-arrow-down el-icon--right"></i>
              </span>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item @click.native="goToProfile">
                  <i class="el-icon-user-solid"></i>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item @click.native="handleLogout">
                  <i class="el-icon-switch-button"></i>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </div>
      </el-header>

      <!-- 主内容区域 -->
      <el-container>
        <!-- 侧边栏 -->
        <el-aside width="200px" class="aside">
          <el-menu 
            default-active="1"
            class="el-menu-vertical-demo"
            @select="handleMenuSelect"
          >
            <el-menu-item index="1">
              <i class="el-icon-s-home"></i>
              <span slot="title">首页</span>
            </el-menu-item>
            <el-menu-item index="2">
              <i class="el-icon-document-copy"></i>
              <span slot="title">作业列表</span>
            </el-menu-item>
            <el-menu-item index="3">
              <i class="el-icon-upload2"></i>
              <span slot="title">我的提交</span>
            </el-menu-item>
            <el-menu-item index="4" v-if="userInfo?.role === 'admin'">
              <i class="el-icon-setting"></i>
              <span slot="title">管理中心</span>
            </el-menu-item>
          </el-menu>
        </el-aside>

        <!-- 内容区域 -->
        <el-main class="main">
          <!-- 欢迎信息 -->
          <div class="welcome-section">
            <h1>欢迎回来，{{ userInfo?.name }}！</h1>
            <p class="welcome-subtitle">今天是 {{ currentDate }}</p>
          </div>

          <!-- 作业概览 -->
          <div class="overview-section">
            <h2>作业概览</h2>
            <div class="overview-cards">
              <el-card class="overview-card">
                <div class="card-content">
                  <div class="card-icon el-icon-document"></div>
                  <div class="card-info">
                    <div class="card-number">{{ totalAssignments }}</div>
                    <div class="card-label">总作业数</div>
                  </div>
                </div>
              </el-card>
              <el-card class="overview-card">
                <div class="card-content">
                  <div class="card-icon el-icon-check"></div>
                  <div class="card-info">
                    <div class="card-number">{{ submittedAssignments }}</div>
                    <div class="card-label">已提交</div>
                  </div>
                </div>
              </el-card>
              <el-card class="overview-card">
                <div class="card-content">
                  <div class="card-icon el-icon-time"></div>
                  <div class="card-info">
                    <div class="card-number">{{ pendingAssignments }}</div>
                    <div class="card-label">待提交</div>
                  </div>
                </div>
              </el-card>
              <el-card class="overview-card">
                <div class="card-content">
                  <div class="card-icon el-icon-warning"></div>
                  <div class="card-info">
                    <div class="card-number">{{ urgentAssignments }}</div>
                    <div class="card-label">紧急作业</div>
                  </div>
                </div>
              </el-card>
            </div>
          </div>

          <!-- 近期作业 -->
          <div class="recent-assignments-section">
            <h2>近期作业</h2>
            <el-table :data="recentAssignments" style="width: 100%">
              <el-table-column prop="title" label="作业名称" width="300"></el-table-column>
              <el-table-column prop="deadline" label="截止日期">
                <template slot-scope="scope">
                  <span :class="{
                    'text-danger': isAssignmentExpired(scope.row.deadline),
                    'text-warning': isAssignmentUrgent(scope.row.deadline)
                  }">
                    {{ formatDate(scope.row.deadline) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态">
                <template slot-scope="scope">
                  <el-tag 
                    v-if="scope.row.status === 'submitted'"
                    type="success"
                  >
                    已提交
                  </el-tag>
                  <el-tag 
                    v-else-if="scope.row.status === 'late'"
                    type="danger"
                  >
                    已逾期
                  </el-tag>
                  <el-tag 
                    v-else-if="isAssignmentExpired(scope.row.deadline)"
                    type="danger"
                  >
                    未提交(逾期)
                  </el-tag>
                  <el-tag 
                    v-else-if="isAssignmentUrgent(scope.row.deadline)"
                    type="warning"
                  >
                    未提交(紧急)
                  </el-tag>
                  <el-tag 
                    v-else
                    type="info"
                  >
                    未提交
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150" fixed="right">
                <template slot-scope="scope">
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="goToDetail(scope.row.id)"
                  >
                    详情
                  </el-button>
                  <el-button 
                    v-if="!isAssignmentExpired(scope.row.deadline) && scope.row.status !== 'submitted'"
                    type="success" 
                    size="small" 
                    @click="goToSubmit(scope.row.id)"
                  >
                    提交
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getCurrentUser, logoutUser } from '../services/userService';
import { getAllAssignments, getTimeRemaining, isAssignmentExpired } from '../services/assignmentService';
import { getSubmissionsByUser } from '../services/submissionService';

export default {
  name: 'HomeView',
  setup() {
    const userInfo = ref(getCurrentUser());
    const currentDate = ref('');
    const assignments = ref([]);
    const submissions = ref([]);
    const totalAssignments = ref(0);
    const submittedAssignments = ref(0);
    const pendingAssignments = ref(0);
    const urgentAssignments = ref(0);
    
    // 格式化日期
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };
    
    // 检查作业是否紧急（24小时内截止）
    const isAssignmentUrgent = (deadline) => {
      const timeRemaining = getTimeRemaining(deadline);
      return !timeRemaining.expired && timeRemaining.days === 0 && timeRemaining.hours < 24;
    };
    
    // 获取近期作业（带状态）
    const recentAssignments = computed(() => {
      return assignments.value.slice(0, 5).map(assignment => {
        // 检查用户是否已提交该作业
        const submission = submissions.value.find(s => s.assignmentId === assignment.id);
        return {
          ...assignment,
          status: submission ? 'submitted' : isAssignmentExpired(assignment.deadline) ? 'late' : 'pending'
        };
      });
    });
    
    // 加载数据
    const loadData = async () => {
      try {
        // 获取当前日期
        const now = new Date();
        currentDate.value = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
        
        // 获取作业列表
        const assignmentsData = await getAllAssignments();
        assignments.value = assignmentsData || [];
        totalAssignments.value = assignments.value.length;
        
        // 获取用户提交记录
        const submissionsData = await getSubmissionsByUser(userInfo.value.studentId);
        submissions.value = submissionsData || [];
        submittedAssignments.value = submissions.value.length;
        
        // 计算待提交和紧急作业数量
        pendingAssignments.value = assignments.value.filter(assignment => {
          const isSubmitted = submissions.value.some(s => s.assignmentId === assignment.id);
          return !isSubmitted && !isAssignmentExpired(assignment.deadline);
        }).length;
        
        urgentAssignments.value = assignments.value.filter(assignment => {
          const isSubmitted = submissions.value.some(s => s.assignmentId === assignment.id);
          return !isSubmitted && !isAssignmentExpired(assignment.deadline) && isAssignmentUrgent(assignment.deadline);
        }).length;
        
      } catch (error) {
        ElMessage.error('加载数据失败');
        console.error('加载数据失败:', error);
      }
    };
    
    // 处理菜单选择
    const handleMenuSelect = (index) => {
      switch (index) {
        case '1':
          window.location.href = '/home';
          break;
        case '2':
          window.location.href = '/assignments';
          break;
        case '3':
          // 我的提交页面（可以在AssignmentListView中筛选）
          window.location.href = '/assignments?submitted=true';
          break;
        case '4':
          window.location.href = '/admin';
          break;
      }
    };
    
    // 跳转到作业详情
    const goToDetail = (id) => {
      window.location.href = `/assignments/${id}`;
    };
    
    // 跳转到提交页面
    const goToSubmit = (id) => {
      window.location.href = `/submit/${id}`;
    };
    
    // 跳转到个人中心
    const goToProfile = () => {
      window.location.href = '/profile';
    };
    
    // 退出登录
    const handleLogout = () => {
      logoutUser();
    };
    
    // 组件挂载时加载数据
    onMounted(() => {
      loadData();
    });
    
    return {
      userInfo,
      currentDate,
      assignments,
      submissions,
      totalAssignments,
      submittedAssignments,
      pendingAssignments,
      urgentAssignments,
      recentAssignments,
      formatDate,
      isAssignmentExpired,
      isAssignmentUrgent,
      handleMenuSelect,
      goToDetail,
      goToSubmit,
      goToProfile,
      handleLogout
    };
  }
};
</script>

<style scoped>
.home-container {
  height: 100vh;
  overflow: hidden;
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

.welcome-section {
  margin-bottom: 30px;
}

.welcome-section h1 {
  color: #303133;
  margin-bottom: 10px;
}

.welcome-subtitle {
  color: #909399;
  font-size: 14px;
}

.overview-section {
  margin-bottom: 30px;
}

.overview-section h2 {
  color: #303133;
  margin-bottom: 20px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.overview-card {
  background-color: white;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.overview-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-content {
  display: flex;
  align-items: center;
  padding: 20px;
}

.card-icon {
  font-size: 36px;
  color: #1890ff;
  margin-right: 20px;
}

.card-info {
  flex: 1;
}

.card-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.card-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.recent-assignments-section h2 {
  color: #303133;
  margin-bottom: 20px;
}

.text-danger {
  color: #f56c6c;
}

.text-warning {
  color: #e6a23c;
}
</style>
<template>
  <div class="home-container">
    <!-- 欢迎信息 -->
    <div class="welcome-section">
      <h1>欢迎回来！</h1>
      <p class="welcome-subtitle">今天是 {{ currentDate }}</p>
    </div>


    <!-- 作业概览 -->
    <div class="overview-section">
      <h2>作业概览</h2>
      <div class="overview-cards">
        <el-card 
          v-for="(card, index) in statsCards" 
          :key="index" 
          class="overview-card"
        >
          <div class="card-content">
            <div class="card-info">
              <div class="card-number">{{ card.value }}</div>
              <div class="card-label">{{ card.label }}</div>
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
            <template v-slot="{ row }">
              <div v-if="row && row.deadline">
                <span :class="{
                  'text-danger': row.deadline && isAssignmentExpired(row.deadline),
                  'text-warning': row.deadline && isAssignmentUrgent(row.deadline)
                }">
                  {{ row.deadline && formatDate(row.deadline) }}
                </span>
              </div>
              <span v-else>-</span>
            </template>
          </el-table-column>
        <el-table-column prop="status" label="状态" min-width="100">
              <template v-slot="{ row }">
                <div>
                    <el-tag
                      :type="getStatusTag(row).type"
                      :key="getStatusTag(row).key"
                    >
                      {{ getStatusTag(row).text }}
                      <template #suffix>
                          <el-icon v-if="getStatusTag(row).key !== 'default' && getStatusTag(row).key !== 'submitted'">
                            <CircleClose />
                          </el-icon>
                        </template>
                    </el-tag>
                  </div>
              </template>
            </el-table-column>
        <el-table-column label="操作" min-width="120" fixed="right">
          <template v-slot="{ row }">
            <div v-if="row && row.id">
              <el-button 
                type="primary" 
                size="small" 
                @click="goToDetail(row.id)"
              >
                详情
              </el-button>
              <el-button 
                v-if="row.deadline && !isAssignmentExpired(row.deadline) && row.status !== 'submitted'"
                type="success" 
                size="small" 
                @click="goToSubmit(row.id)"
              >
                提交
              </el-button>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>
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
              @click="goToDetail(scope.row.assignmentId)"
            >
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>


  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { CircleClose, Loading } from '@element-plus/icons-vue';
import { getCurrentUser, logoutUser } from '../services/userService';
import { getAllAssignments, getTimeRemaining, isAssignmentExpired } from '../services/assignmentService';
import { getSubmissionsByUser } from '../services/submissionService';

// 合并HomeView和UserProfileView组件
export default {
  name: 'HomeView',
  components: {
    CircleClose,
    Loading
  },
  setup() {
    const router = useRouter();
    const userInfo = ref(getCurrentUser());
    const currentDate = ref('');
    const assignments = ref([]);
    const submissions = ref([]);
    const recentSubmissionsData = ref([]); // 新增：最近提交记录
    const totalAssignments = ref(0);
    const submittedAssignments = ref(0);
    const pendingAssignments = ref(0);
    const urgentAssignments = ref(0);
    const overdueAssignments = ref(0); // 新增：逾期作业数量
    

    
    // 统计卡片数据
    const statsCards = ref([
      {
        label: '总作业数',
        value: computed(() => totalAssignments.value)
      },
      {
        label: '待提交',
        value: computed(() => pendingAssignments.value)
      },
      {
        label: '紧急作业',
        value: computed(() => urgentAssignments.value)
      },
      {
        label: '已逾期',
        value: computed(() => overdueAssignments.value)
      }
    ])
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };
    
    // 检查作业是否紧急（24小时内截止）
    const isAssignmentUrgent = (deadline) => {
      const timeRemaining = getTimeRemaining(deadline);
      return !timeRemaining.expired && timeRemaining.days === 0 && timeRemaining.hours < 24;
    };
    
    // 获取作业状态标签配置的函数
    const getStatusTag = (row) => {
      if (!row) {
        return { type: 'info', text: '-', key: 'empty' };
      }
      
      if (row.status === 'submitted') {
        return { type: 'success', text: '已提交', key: 'submitted' };
      }
      if (row.status === 'late') {
        return { type: 'danger', text: '已逾期', key: 'late' };
      }
      if (row.deadline && isAssignmentExpired(row.deadline)) {
        return { type: 'danger', text: '未提交(逾期)', key: 'notSubmittedExpired' };
      }
      if (row.deadline && isAssignmentUrgent(row.deadline)) {
        return { type: 'warning', text: '未提交(紧急)', key: 'notSubmittedUrgent' };
      }
      return { type: 'info', text: '未提交', key: 'default' };
    }
    
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
    
    // 加载数据 - 合并了两个组件的数据加载逻辑
    const loadData = async () => {
      try {
        // 获取当前日期
        const now = new Date();
        currentDate.value = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
        
        // 获取当前用户信息
        const currentUser = getCurrentUser();
        userInfo.value = currentUser;
        
        // 获取作业列表
        const assignmentsData = await getAllAssignments();
        assignments.value = assignmentsData || [];
        totalAssignments.value = assignments.value.length;
        
        // 获取用户提交记录
        const studentId = currentUser.user?.studentId || currentUser.studentId;
        const submissionsData = await getSubmissionsByUser(studentId);
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
        
        // 计算逾期作业数量
        // 统计两部分：1) 已提交但逾期的作业 2) 未提交但已过期的作业
        const submittedLateCount = submissions.value.filter(s => s.status === 'late').length;
        const notSubmittedExpiredCount = assignments.value.filter(assignment => {
          const isSubmitted = submissions.value.some(s => s.assignmentId === assignment.id);
          return !isSubmitted && isAssignmentExpired(assignment.deadline);
        }).length;
        overdueAssignments.value = submittedLateCount + notSubmittedExpiredCount;
        
        // 获取最近的5条提交记录
        recentSubmissionsData.value = [...submissions.value]
          .sort((a, b) => new Date(b.submitTime) - new Date(a.submitTime))
          .slice(0, 5)
          .map(submission => {
            // 查找对应的作业信息
            const assignment = assignments.value.find(a => a.id === submission.assignmentId);
            return {
              ...submission,
              assignmentTitle: assignment?.title || '未知作业'
            };
          });

          console.log(userInfo)
          
      } catch (error) {
        ElMessage.error('加载数据失败');
        console.error('加载数据失败:', error);
      }
    };
    
    // 跳转到作业详情
    const goToDetail = (id) => {
      console.log('Navigating to assignment detail with id:', id);
      router.push(`/assignments/${id}`);
    };
    
    // 跳转到提交页面
    const goToSubmit = (id) => {
      router.push(`/submit/${id}`);
    };
    
    // 跳转到个人中心 - 重定向到首页（因为个人中心内容已合并到首页）
    const goToProfile = () => {
      router.push('/home');
    };
    
    // 退出登录
    const handleLogout = () => {
      // 使用Element Plus的确认对话框
      ElMessageBox.confirm('确定要退出登录吗？', '退出登录', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        logoutUser();
      }).catch(() => {
        // 用户取消退出登录
        ElMessage.info('已取消退出登录');
      });
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
      recentSubmissionsData,
      totalAssignments,
      submittedAssignments,
      pendingAssignments,
      urgentAssignments,
      overdueAssignments,
      statsCards,
      recentAssignments,
      formatDate,
      isAssignmentExpired,
      isAssignmentUrgent,
      getStatusTag,
      goToDetail,
      goToSubmit,
      goToProfile,
      handleLogout
    };
  }
}
</script>

<style scoped>
.home-container {
  background-color: #f5f7fa;
  padding: 20px;
  min-height: calc(100vh - 60px);
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: auto;
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


/* 作业概览样式 */
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
  justify-content: center;
  text-align: center;
  padding: 20px;
}

.card-info {
  width: 100%;
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

/* 近期作业样式 */
.recent-assignments-section {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.recent-assignments-section h2 {
  color: #303133;
  margin-bottom: 20px;
}

/* 最近提交记录样式 */
.recent-submissions {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.recent-submissions h3 {
  color: #303133;
  margin-bottom: 20px;
  font-size: 18px;
}

/* 状态文本样式 */
.text-danger {
  color: #f56c6c;
}

.text-warning {
  color: #e6a23c;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .home-container {
    padding: 15px;
  }
  

  .recent-assignments-section,
  .recent-submissions {
    padding: 20px 15px;
    width: 100%;
  }
  
  .overview-cards {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  

  
  .el-table {
    width: 100%;
    overflow-x: auto;
  }
}
</style>
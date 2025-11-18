<template>
  <div class="home-container">
    <!-- 欢迎信息 -->
    <welcome-section :current-date="currentDate" />
    
    <!-- 作业概览 -->
    <stats-section :stats-cards="statsCards" />
    
    <!-- 近期作业 -->
    <recent-assignments-section 
      :recent-assignments="recentAssignments"
      @go-to-detail="goToDetail"
    />
    
    <!-- 最近提交记录 -->
    <recent-submissions-section 
      :recent-submissions-data="recentSubmissionsData"
      @go-to-detail="goToDetail"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getCurrentUser, logoutUser } from '../services/userService';
import { getAllAssignments, getTimeRemaining, isAssignmentExpired } from '../services/assignmentService';
import { getSubmissionsByUser } from '../services/submissionService';

// 导入子组件
import WelcomeSection from '../components/Home/WelcomeSection.vue';
import StatsSection from '../components/Home/StatsSection.vue';
import RecentAssignmentsSection from '../components/Home/RecentAssignmentsSection.vue';
import RecentSubmissionsSection from '../components/Home/RecentSubmissionsSection.vue';

// 主页面组件
export default {
  name: 'HomeView',
  components: {
    WelcomeSection,
    StatsSection,
    RecentAssignmentsSection,
    RecentSubmissionsSection
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
    

    
    // 检查作业是否紧急（24小时内截止）
    const isAssignmentUrgent = (deadline) => {
      if (!deadline) return false;
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const diff = deadlineDate - now;
      return diff > 0 && diff < 24 * 60 * 60 * 1000;
    };
    
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
    
    // 获取近期作业（带状态）
    const recentAssignments = computed(() => {
      return assignments.value.slice(0, 5).map(assignment => {
        // 检查用户是否已提交该作业
        const submission = submissions.value.find(s => s.assignmentId === assignment.id);
        return {
          ...assignment,
          status: submission?.status === 'submitted' ? 'submitted' : isAssignmentExpired(assignment.deadline) ? 'late' : 'pending'
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
          const isSubmitted = submissions.value.some(s => s.assignmentId === assignment.id && s.status === 'submitted');
          return !isSubmitted && !isAssignmentExpired(assignment.deadline);
        }).length;
        
        urgentAssignments.value = assignments.value.filter(assignment => {
          const isSubmitted = submissions.value.some(s => s.assignmentId === assignment.id && s.status === 'submitted');
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
          .filter(s => s.status === 'submitted') // 只显示已提交的记录
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

/* 响应式调整 */
@media (max-width: 768px) {
  .home-container {
    padding: 15px;
  }
}
</style>
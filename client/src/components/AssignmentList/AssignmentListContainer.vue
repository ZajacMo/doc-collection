<template>
  <div class="assignment-list-container">
    <!-- 页面标题和操作 -->
    <AssignmentListHeader 
      :userInfo="userInfo"
      @create="showCreateDialog"
    />

    <!-- 筛选和搜索 -->
    <FilterSection 
      :initialStatusFilter="statusFilter"
      :initialUrgentFilter="urgentFilter"
      :initialSearchKeyword="searchKeyword"
      @filter-change="handleFilterChange"
      @search="handleSearch"
    />

    <!-- 作业表格 -->
    <AssignmentTable 
      :assignments="filteredAssignments"
      :userInfo="userInfo"
      @detail="goToDetail"
      @delete="handleDelete"
    />

    <!-- 分页 -->
    <AssignmentPagination 
      :total="filteredAssignments.length"
      :initialCurrentPage="currentPage"
      :initialPageSize="pageSize"
      @page-change="handlePageChange"
    />

    <!-- 创建作业对话框组件 -->
    <AssignmentFormDialog
      v-model:visible="createDialogVisible"
      dialog-type="create"
      @submit="handleCreateSubmit"
      @cancel="handleCreateCancel"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getCurrentUserInfo, logoutUser } from '../../services/userService';
import { 
  getAllAssignments, 
  createAssignment, 
  deleteAssignment, 
  isAssignmentExpired 
} from '../../services/assignmentService';
import { getSubmissionsByUser } from '../../services/submissionService';
import AssignmentFormDialog from '../AssignmentFormDialog.vue';
import AssignmentListHeader from './AssignmentListHeader.vue';
import FilterSection from './FilterSection.vue';
import AssignmentTable from './AssignmentTable.vue';
import AssignmentPagination from './AssignmentPagination.vue';

export default {
  name: 'AssignmentListContainer',
  components: {
    AssignmentFormDialog,
    AssignmentListHeader,
    FilterSection,
    AssignmentTable,
    AssignmentPagination
  },
  setup() {
    const userInfo = ref(getCurrentUserInfo());
    const assignments = ref([]);
    const submissions = ref([]);
    const statusFilter = ref('all');
    const urgentFilter = ref('all');
    const searchKeyword = ref('');
    const currentPage = ref(1);
    const pageSize = ref(10);
    const createDialogVisible = ref(false);
    const sidebarVisible = ref(true);
    const isMobile = ref(window.innerWidth < 768);
    const createFormRef = ref(null);

    // 检查作业是否紧急（24小时内截止）
    const isAssignmentUrgent = (deadline) => {
      if (!deadline) return false;
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const diff = deadlineDate - now;
      return diff > 0 && diff < 24 * 60 * 60 * 1000;
    };
    
    // 获取带状态的作业列表
    const assignmentsWithStatus = computed(() => {
      return assignments.value.map(assignment => {
        // 检查用户是否已提交该作业
        const submission = submissions.value.find(s => s.assignmentId === assignment.id);
        return {
          ...assignment,
          status: submission ? 'submitted' : isAssignmentExpired(assignment.deadline) ? 'late' : 'pending'
        };
      });
    });
    
    // 根据筛选条件过滤作业
    const filteredAssignments = computed(() => {
      let result = [...assignmentsWithStatus.value];
      
      // 按状态筛选
      if (statusFilter.value !== 'all') {
        result = result.filter(assignment => assignment.status === statusFilter.value);
      }
      
      // 按紧急程度筛选
      if (urgentFilter.value !== 'all') {
        if (urgentFilter.value === 'urgent') {
          result = result.filter(assignment => isAssignmentUrgent(assignment.deadline));
        } else if (urgentFilter.value === 'normal') {
          result = result.filter(assignment => !isAssignmentUrgent(assignment.deadline) && !isAssignmentExpired(assignment.deadline));
        } else if (urgentFilter.value === 'expired') {
          result = result.filter(assignment => isAssignmentExpired(assignment.deadline));
        }
      }
      
      // 按关键词搜索
      if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase();
        result = result.filter(assignment => 
          assignment.title.toLowerCase().includes(keyword) || 
          assignment.description.toLowerCase().includes(keyword)
        );
      }
      
      return result;
    });
    
    // 加载数据
    const loadData = async () => {
      try {
        // 获取作业列表
        const assignmentsData = await getAllAssignments();
        assignments.value = assignmentsData || [];
        
        // 只有在用户已登录时才获取提交记录
        if (userInfo.value && userInfo.value.studentId) {
          const submissionsData = await getSubmissionsByUser(userInfo.value.studentId);
          submissions.value = submissionsData || [];
        } else {
          submissions.value = [];
        }
        
      } catch (error) {
        ElMessage.error('加载数据失败');
        console.error('加载数据失败:', error);
      }
    };
    
    // 处理筛选变更
    const handleFilterChange = (filters) => {
      statusFilter.value = filters.statusFilter;
      urgentFilter.value = filters.urgentFilter;
      searchKeyword.value = filters.searchKeyword;
      currentPage.value = 1; // 重置到第一页
    };
    
    // 处理搜索
    const handleSearch = (filters) => {
      statusFilter.value = filters.statusFilter;
      urgentFilter.value = filters.urgentFilter;
      searchKeyword.value = filters.searchKeyword;
      currentPage.value = 1; // 重置到第一页
    };
    
    // 处理分页变更
    const handlePageChange = (pageInfo) => {
      currentPage.value = pageInfo.currentPage;
      pageSize.value = pageInfo.pageSize;
    };
    
    // 跳转到作业详情
    const goToDetail = (id) => {
      window.location.href = `/assignments/${id}`;
    };
    
    // 显示创建作业对话框
    const showCreateDialog = () => {
      createDialogVisible.value = true;
    };
    
    // 处理创建作业提交
    const handleCreateSubmit = async (formData) => {
      try {
        // 调用创建作业接口
        await createAssignment(formData);
        
        ElMessage.success('作业创建成功');
        createDialogVisible.value = false;
        
        // 重新加载数据
        loadData();
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '创建作业失败');
        console.error('创建作业失败:', error);
      }
    };
    
    // 处理创建作业取消
    const handleCreateCancel = () => {
      // 取消操作由组件内部处理
    };
    
    // 处理删除作业
    const handleDelete = async (data) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除作业「${data.title}」吗？删除后将无法恢复。`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        
        // 调用删除接口
        await deleteAssignment(data.id);
        
        ElMessage.success('作业删除成功');
        
        // 重新加载数据
        loadData();
      } catch (error) {
        // 用户取消删除不会抛出错误，只有真正的错误才会显示提示
        if (error !== 'cancel') {
          ElMessage.error(error.response?.data?.message || '删除作业失败');
          console.error('删除作业失败:', error);
        }
      }
    };
    
    // 窗口大小变化处理（保留以支持响应式）
    const handleResize = () => {
      // 响应式调整逻辑已移至布局组件
    };

    // 组件挂载时加载数据
    onMounted(() => {
      loadData();
      window.addEventListener('resize', handleResize);
    });
    
    return {
      userInfo,
      assignments,
      submissions,
      statusFilter,
      urgentFilter,
      searchKeyword,
      currentPage,
      pageSize,
      createDialogVisible,
      filteredAssignments,
      loadData,
      handleFilterChange,
      handleSearch,
      handlePageChange,
      goToDetail,
      showCreateDialog,
      handleCreateSubmit,
      handleCreateCancel,
      handleDelete,
      isAssignmentUrgent,
      isAssignmentExpired
    };
  }
};
</script>

<style scoped>
.assignment-list-container {
  padding: 20px;
  height: calc(100vh - 60px);
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: auto;
}
</style>
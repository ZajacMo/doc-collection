<template>
  <div class="assignment-list-container">
        <!-- 内容区域 -->
          <!-- 页面标题和操作 -->
          <div class="page-header">
            <h2>作业</h2>
            <el-button 
              v-if="userInfo?.role === 'admin'" 
              type="primary" 
              @click="showCreateDialog"
            >
              <i class="el-icon-plus"></i>
              创建作业
            </el-button>
          </div>

          <!-- 筛选和搜索 -->
          <div class="filter-section">
            <el-row :gutter="20">
              <el-col :span="6">
                <el-select v-model="statusFilter" placeholder="选择状态" @change="handleFilterChange">
                  <el-option label="全部" value="all"></el-option>
                  <el-option label="未提交" value="pending"></el-option>
                  <el-option label="已提交" value="submitted"></el-option>
                  <el-option label="已逾期" value="late"></el-option>
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-select v-model="urgentFilter" placeholder="紧急程度" @change="handleFilterChange">
                  <el-option label="全部" value="all"></el-option>
                  <el-option label="紧急" value="urgent"></el-option>
                  <el-option label="非紧急" value="normal"></el-option>
                </el-select>
              </el-col>
              <el-col :span="12">
                <el-input 
                  v-model="searchKeyword" 
                  placeholder="搜索作业名称" 
                  prefix-icon="el-icon-search"
                  @keyup.enter.native="handleSearch"
                >
                  <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
                </el-input>
              </el-col>
            </el-row>
          </div>

          <!-- 作业表格 -->
          <div class="table-section">
            <el-table 
              :data="filteredAssignments" 
              style="width: 100%"
              stripe
              border
              max-height="600"
            >
              <el-table-column type="index" label="序号" min-width="60"></el-table-column>
              <el-table-column prop="title" label="作业名称" min-width="200"></el-table-column>
              <el-table-column prop="createTime" label="创建时间" min-width="140">
                <template v-slot="{ row }">
                  {{ row && row.createTime ? formatDate(row.createTime) : '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="deadline" label="截止日期" min-width="140">
                <template v-slot="{ row }">
                  <span v-if="row && row.deadline" :class="{
                    'text-danger': isAssignmentExpired(row.deadline),
                    'text-warning': isAssignmentUrgent(row.deadline)
                  }">
                    {{ formatDate(row.deadline) }}
                  </span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="我的状态" width="120">
                <template v-slot="{ row }">
                  <div v-if="row">
                    <el-tag 
                      v-if="row.status === 'submitted'"
                      type="success"
                    >
                      已提交
                    </el-tag>
                    <el-tag 
                      v-else-if="row.status === 'late'"
                      type="danger"
                    >
                      已逾期
                    </el-tag>
                    <el-tag 
                      v-else-if="row.deadline && isAssignmentExpired(row.deadline)"
                      type="danger"
                    >
                      未提交(逾期)
                    </el-tag>
                    <el-tag 
                      v-else-if="row.deadline && isAssignmentUrgent(row.deadline)"
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
                  </div>
                  <el-tag v-else type="info">-</el-tag>
                </template>
              </el-table-column>
              <!-- 文件命名规则列已移除 -->
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
                      v-if="userInfo?.role === 'admin'"
                      type="danger" 
                      size="small" 
                      @click="handleDelete(row.id, row.title)"
                    >
                      删除
                    </el-button>
                  </div>
                  <span v-else>-</span>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 分页 -->
          <div class="pagination-section">
            <el-pagination
              v-model="currentPage"
              :page-sizes="[10, 20, 50, 100]"
              :page-size="pageSize"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredAssignments.length"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
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
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getCurrentUserInfo, logoutUser } from '../services/userService';
import { 
  getAllAssignments, 
  createAssignment, 
  deleteAssignment, 
  isAssignmentExpired 
} from '../services/assignmentService';
import { getSubmissionsByUser } from '../services/submissionService';
import AssignmentFormDialog from '../components/AssignmentFormDialog.vue';

export default {
  name: 'AssignmentListView',
  components: {
    AssignmentFormDialog
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
    const createForm = reactive({
      title: '',
      description: '',
      deadline: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
      fileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar']
    });
    const createRules = {
      title: [
        { required: true, message: '请输入作业名称', trigger: 'blur' },
        { max: 100, message: '作业名称最多100个字符', trigger: 'blur' }
      ],
      description: [
        { required: true, message: '请输入作业描述', trigger: 'blur' }
      ],
      deadline: [
        { required: true, message: '请选择截止日期', trigger: 'change' }
      ],
      fileTypes: [
        { required: true, message: '请至少选择一种允许的文件类型', trigger: 'change' }
      ]
    };
    
    // 格式化日期
    const formatDate = (dateString) => {
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
    
    // 计算总数
    const totalAssignments = computed(() => filteredAssignments.value.length);

    
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
    const handleFilterChange = () => {
      currentPage.value = 1; // 重置到第一页
    };
    
    // 处理搜索
    const handleSearch = () => {
      currentPage.value = 1; // 重置到第一页
    };
    
    // 处理分页大小变更
    const handleSizeChange = (size) => {
      pageSize.value = size;
      currentPage.value = 1; // 重置到第一页
    };
    
    // 处理当前页码变更
    const handleCurrentChange = (current) => {
      currentPage.value = current;
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
    
    // 窗口大小变化处理（保留以支持响应式）
    const handleResize = () => {
      // 响应式调整逻辑已移至布局组件
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
    const handleDelete = async (id, title) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除作业「${title}」吗？删除后将无法恢复。`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        
        // 调用删除接口
        await deleteAssignment(id);
        
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
      assignmentsWithStatus,
      filteredAssignments,
      totalAssignments,
      loadData,
      handleFilterChange,
      handleSearch,
      handleSizeChange,
      handleCurrentChange,
      goToDetail,
      goToSubmit,
      goToProfile,
      handleLogout,
      showCreateDialog,
      handleCreateSubmit,
      handleCreateCancel,
      handleDelete,
      formatDate,
      isAssignmentUrgent,
      isAssignmentExpired
    };
  }
};
</script>

<style scoped>
.assignment-list-container {
  /* background-color: #f5f7fa; */
  padding: 20px;
  height: calc(100vh - 60px);
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

/* 移动端响应式样式 */
@media screen and (max-width: 768px) {
  .mobile-menu-btn {
    display: flex;
  }
  
  .header-content {
    justify-content: flex-start;
  }
  
  .main {
    padding: 10px;
  }
  
  .filter-section,
  .table-section,
  .pagination-section {
    padding: 15px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .page-header h2 {
    font-size: 18px;
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  color: #303133;
  margin: 0;
}

.filter-section {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.table-section {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.pagination-section {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  justify-content: flex-end;
}

.assignment-title-link {
  cursor: pointer;
  color: #1890ff;
}

.assignment-title-link:hover {
  text-decoration: underline;
}

/* 文件命名规则样式已移除 */

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
</style>
<template>
  <div class="assignment-list-container">
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
            default-active="2"
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
          <!-- 页面标题和操作 -->
          <div class="page-header">
            <h2>作业列表</h2>
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
            >
              <el-table-column type="index" label="序号" width="80"></el-table-column>
              <el-table-column prop="title" label="作业名称" width="300">
                <template slot-scope="scope">
                  <span @click="goToDetail(scope.row.id)" class="assignment-title-link">
                    {{ scope.row.title }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="创建时间" width="180">
                <template slot-scope="scope">
                  {{ formatDate(scope.row.createTime) }}
                </template>
              </el-table-column>
              <el-table-column prop="deadline" label="截止日期" width="180">
                <template slot-scope="scope">
                  <span :class="{
                    'text-danger': isAssignmentExpired(scope.row.deadline),
                    'text-warning': isAssignmentUrgent(scope.row.deadline)
                  }">
                    {{ formatDate(scope.row.deadline) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="我的状态" width="120">
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
              <el-table-column label="文件命名规则" min-width="200">
                <template slot-scope="scope">
                  <el-tooltip :content="scope.row.namingRule" placement="top">
                    <div class="naming-rule">{{ scope.row.namingRule }}</div>
                  </el-tooltip>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="180" fixed="right">
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
                  <el-button 
                    v-if="userInfo?.role === 'admin'"
                    type="danger" 
                    size="small" 
                    @click="handleDelete(scope.row.id, scope.row.title)"
                  >
                    删除
                  </el-button>
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
        </el-main>
      </el-container>
    </el-container>

    <!-- 创建作业对话框 -->
    <el-dialog 
      title="创建作业" 
      :visible.sync="createDialogVisible"
      width="600px"
    >
      <el-form 
        ref="createFormRef" 
        :model="createForm" 
        :rules="createRules" 
        label-width="100px"
      >
        <el-form-item label="作业名称" prop="title">
          <el-input v-model="createForm.title" placeholder="请输入作业名称"></el-input>
        </el-form-item>
        <el-form-item label="作业描述" prop="description">
          <el-input 
            v-model="createForm.description" 
            type="textarea" 
            placeholder="请输入作业描述"
            :rows="4"
          ></el-input>
        </el-form-item>
        <el-form-item label="截止日期" prop="deadline">
          <el-date-picker
            v-model="createForm.deadline"
            type="datetime"
            placeholder="选择截止日期时间"
            style="width: 100%"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="文件命名规则" prop="namingRule">
          <el-input 
            v-model="createForm.namingRule" 
            placeholder="例如：{学号}_{姓名}_{作业名称}_{提交日期}"
          ></el-input>
          <div class="form-tip">支持的变量：{学号}, {姓名}, {作业名称}, {提交日期}</div>
        </el-form-item>
        <el-form-item label="允许的文件类型" prop="fileTypes">
          <el-select 
            v-model="createForm.fileTypes" 
            multiple 
            placeholder="选择允许的文件类型"
          >
            <el-option label="PDF" value="pdf"></el-option>
            <el-option label="Word文档" value="doc"></el-option>
            <el-option label="Word文档" value="docx"></el-option>
            <el-option label="Excel表格" value="xls"></el-option>
            <el-option label="Excel表格" value="xlsx"></el-option>
            <el-option label="PPT演示" value="ppt"></el-option>
            <el-option label="PPT演示" value="pptx"></el-option>
            <el-option label="ZIP压缩" value="zip"></el-option>
            <el-option label="RAR压缩" value="rar"></el-option>
            <el-option label="图片" value="jpg"></el-option>
            <el-option label="图片" value="jpeg"></el-option>
            <el-option label="图片" value="png"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateAssignment">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getCurrentUser, logoutUser } from '../services/userService';
import { 
  getAllAssignments, 
  createAssignment, 
  deleteAssignment, 
  isAssignmentExpired 
} from '../services/assignmentService';
import { getSubmissionsByUser } from '../services/submissionService';

export default {
  name: 'AssignmentListView',
  setup() {
    const userInfo = ref(getCurrentUser());
    const assignments = ref([]);
    const submissions = ref([]);
    const statusFilter = ref('all');
    const urgentFilter = ref('all');
    const searchKeyword = ref('');
    const currentPage = ref(1);
    const pageSize = ref(10);
    const createDialogVisible = ref(false);
    const createFormRef = ref(null);
    const createForm = ref({
      title: '',
      description: '',
      deadline: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 默认一周后
      namingRule: '{学号}_{姓名}_{作业名称}_{提交日期}',
      fileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar']
    });
    
    const createRules = ref({
      title: [
        { required: true, message: '请输入作业名称', trigger: 'blur' },
        { min: 2, max: 100, message: '作业名称长度在 2 到 100 个字符之间', trigger: 'blur' }
      ],
      deadline: [
        { required: true, message: '请选择截止日期', trigger: 'change' }
      ],
      namingRule: [
        { required: true, message: '请输入文件命名规则', trigger: 'blur' }
      ],
      fileTypes: [
        {
          required: true,
          message: '请至少选择一种文件类型',
          trigger: 'change',
          type: 'array',
          min: 1
        }
      ]
    });
    
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
      if (urgentFilter.value === 'urgent') {
        result = result.filter(assignment => 
          !isAssignmentExpired(assignment.deadline) && isAssignmentUrgent(assignment.deadline)
        );
      } else if (urgentFilter.value === 'normal') {
        result = result.filter(assignment => 
          isAssignmentExpired(assignment.deadline) || !isAssignmentUrgent(assignment.deadline)
        );
      }
      
      // 按关键词搜索
      if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase();
        result = result.filter(assignment => 
          assignment.title.toLowerCase().includes(keyword) ||
          assignment.description.toLowerCase().includes(keyword)
        );
      }
      
      // 分页处理
      const start = (currentPage.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      return result.slice(start, end);
    });
    
    // 加载数据
    const loadData = async () => {
      try {
        // 获取作业列表
        const assignmentsData = await getAllAssignments();
        assignments.value = assignmentsData || [];
        
        // 获取用户提交记录
        const submissionsData = await getSubmissionsByUser(userInfo.value.studentId);
        submissions.value = submissionsData || [];
        
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
          statusFilter.value = 'submitted';
          handleFilterChange();
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
    
    // 显示创建作业对话框
    const showCreateDialog = () => {
      createDialogVisible.value = true;
    };
    
    // 处理创建作业
    const handleCreateAssignment = async () => {
      try {
        // 表单验证
        await createFormRef.value.validate();
        
        // 调用创建作业接口
        await createAssignment(createForm.value);
        
        ElMessage.success('作业创建成功');
        createDialogVisible.value = false;
        
        // 重置表单
        createForm.value = {
          title: '',
          description: '',
          deadline: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
          namingRule: '{学号}_{姓名}_{作业名称}_{提交日期}',
          fileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar']
        };
        
        // 重新加载数据
        loadData();
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '创建作业失败');
        console.error('创建作业失败:', error);
      }
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
      createFormRef,
      createForm,
      createRules,
      filteredAssignments,
      formatDate,
      isAssignmentExpired,
      isAssignmentUrgent,
      handleFilterChange,
      handleSearch,
      handleSizeChange,
      handleCurrentChange,
      handleMenuSelect,
      goToDetail,
      goToSubmit,
      goToProfile,
      handleLogout,
      showCreateDialog,
      handleCreateAssignment,
      handleDelete
    };
  }
};
</script>

<style scoped>
.assignment-list-container {
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

.naming-rule {
  font-size: 12px;
  color: #606266;
  word-break: break-all;
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
</style>
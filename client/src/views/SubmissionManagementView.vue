<template>
  <div class="submission-management-container">
          <!-- 页面标题 -->
          <div class="page-header">
            <h2>提交管理</h2>
          </div>

          <!-- 筛选器和搜索 -->
          <div class="filters-container">
            <el-row :gutter="20">
              <el-col :span="6">
                <el-select 
                  v-model="assignmentFilter" 
                  placeholder="选择作业"
                  @change="handleAssignmentFilterChange"
                >
                  <el-option label="全部作业" value="all"></el-option>
                  <el-option 
                    v-for="assignment in allAssignments" 
                    :key="assignment.id" 
                    :label="assignment.title" 
                    :value="assignment.id"
                  ></el-option>
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-select 
                  v-model="statusFilter" 
                  placeholder="选择状态"
                  @change="handleStatusFilterChange"
                >
                  <el-option label="全部" value="all"></el-option>
                  <el-option label="已提交" value="submitted"></el-option>
                  <el-option label="已逾期" value="late"></el-option>
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-select 
                  v-model="classFilter" 
                  placeholder="选择班级"
                  @change="handleClassFilterChange"
                >
                  <el-option label="全部班级" value="all"></el-option>
                  <el-option 
                    v-for="className in uniqueClasses" 
                    :key="className" 
                    :label="className" 
                    :value="className"
                  ></el-option>
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-input 
                  v-model="searchKeyword" 
                  placeholder="搜索用户（学号/姓名）" 
                  prefix-icon="el-icon-search"
                  @keyup.enter.native="handleSearch"
                >
                  <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
                </el-input>
              </el-col>
            </el-row>
          </div>

          <!-- 操作按钮组 -->
          <div class="action-buttons">
            <el-button 
              type="primary" 
              @click="batchDownload"
              :disabled="selectedSubmissions.length === 0"
            >
              <i class="el-icon-download"></i>
              批量下载
            </el-button>
            <el-button 
              type="danger" 
              @click="batchDelete"
              :disabled="selectedSubmissions.length === 0"
            >
              <i class="el-icon-delete"></i>
              批量删除
            </el-button>
            <el-button @click="refreshData">
              <i class="el-icon-refresh"></i>
              刷新数据
            </el-button>
          </div>

          <!-- 统计信息卡片 -->
          <div class="stats-cards">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon">
                  <i class="el-icon-upload2"></i>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ totalSubmissions }}</div>
                  <div class="stat-label">总提交数</div>
                </div>
              </div>
            </el-card>
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon">
                  <i class="el-icon-check"></i>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ onTimeSubmissions }}</div>
                  <div class="stat-label">按时提交</div>
                </div>
              </div>
            </el-card>
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon">
                  <i class="el-icon-clock"></i>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ lateSubmissions }}</div>
                  <div class="stat-label">逾期提交</div>
                </div>
              </div>
            </el-card>
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon">
                  <i class="el-icon-user"></i>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ uniqueSubmitters }}</div>
                  <div class="stat-label">提交人数</div>
                </div>
              </div>
            </el-card>
          </div>

          <!-- 提交列表表格 -->
          <el-card class="submission-table-container">
            <el-table 
              v-loading="loading" 
              :data="paginatedSubmissions" 
              style="width: 100%"
              border
              stripe
              max-height="600"
              @selection-change="handleSelectionChange"
            >
              <el-table-column type="selection" width="55"></el-table-column>
              <el-table-column type="index" label="序号" min-width="60"></el-table-column>
              <el-table-column prop="assignmentTitle" label="作业名称" min-width="180"></el-table-column>
              <el-table-column prop="studentId" label="学号" min-width="100"></el-table-column>
              <el-table-column prop="studentName" label="姓名" min-width="80"></el-table-column>
              <el-table-column prop="className" label="班级" width="120" sortable></el-table-column>
              <el-table-column prop="submitTime" label="提交时间" width="180" sortable>
                <template slot-scope="scope">
                  {{ formatDate(scope.row.submitTime) }}
                </template>
              </el-table-column>
              <el-table-column prop="fileName" label="文件名" min-width="250">
                <template slot-scope="scope">
                  <el-popover 
                    placement="top" 
                    title="文件详情" 
                    width="300" 
                    trigger="hover"
                  >
                    <div class="file-info">
                      <p><strong>文件名：</strong>{{ scope.row.fileName }}</p>
                      <p><strong>文件大小：</strong>{{ formatFileSize(scope.row.fileSize) }}</p>
                      <p><strong>文件类型：</strong>{{ scope.row.fileType }}</p>
                    </div>
                    <el-link type="primary" slot="reference">
                      {{ scope.row.fileName }}
                    </el-link>
                  </el-popover>
                </template>
              </el-table-column>
              <el-table-column prop="fileSize" label="文件大小" width="100" sortable>
                <template slot-scope="scope">
                  {{ formatFileSize(scope.row.fileSize) }}
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100" sortable>
                <template slot-scope="scope">
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
              <el-table-column label="操作" min-width="120" fixed="right">
                <template slot-scope="scope">
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="downloadSubmission(scope.row)"
                    :loading="downloadingIds.includes(scope.row.id)"
                  >
                    <i class="el-icon-download"></i>
                    下载
                  </el-button>
                  <el-button 
                    type="danger" 
                    size="small" 
                    @click="deleteSubmission(scope.row.id, scope.row.studentName, scope.row.assignmentTitle)"
                    :loading="deletingIds.includes(scope.row.id)"
                  >
                    <i class="el-icon-delete"></i>
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>

          <!-- 分页控件 -->
          <div class="pagination-container">
            <el-pagination
              v-model="currentPage"
              :page-sizes="[10, 20, 50, 100]"
              :page-size="pageSize"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredSubmissions.length"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
    <!-- 提交详情对话框 -->
    <el-dialog 
      title="提交详情" 
      :visible.sync="detailDialogVisible"
      width="700px"
    >
      <div class="submission-detail">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>作业名称：</label>
              <span>{{ selectedSubmission?.assignmentTitle }}</span>
            </div>
            <div class="detail-item">
              <label>学号：</label>
              <span>{{ selectedSubmission?.studentId }}</span>
            </div>
            <div class="detail-item">
              <label>姓名：</label>
              <span>{{ selectedSubmission?.studentName }}</span>
            </div>
            <div class="detail-item">
              <label>班级：</label>
              <span>{{ selectedSubmission?.className }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>提交时间：</label>
              <span>{{ formatDate(selectedSubmission?.submitTime) }}</span>
            </div>
            <div class="detail-item">
              <label>截止时间：</label>
              <span>{{ formatDate(selectedSubmission?.deadline) }}</span>
            </div>
            <div class="detail-item">
              <label>状态：</label>
              <span>
                <el-tag 
                  v-if="selectedSubmission?.status === 'submitted'"
                  type="success"
                >
                  已提交
                </el-tag>
                <el-tag 
                  v-if="selectedSubmission?.status === 'late'"
                  type="danger"
                >
                  已逾期
                </el-tag>
              </span>
            </div>
            <div class="detail-item">
              <label>逾期时长：</label>
              <span>{{ getLateTimeText(selectedSubmission) }}</span>
            </div>
          </el-col>
        </el-row>
        
        <div class="file-detail">
          <h4>文件信息</h4>
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <label>文件名：</label>
                <span>{{ selectedSubmission?.fileName }}</span>
              </div>
              <div class="detail-item">
                <label>文件大小：</label>
                <span>{{ formatFileSize(selectedSubmission?.fileSize) }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>文件类型：</label>
                <span>{{ selectedSubmission?.fileType }}</span>
              </div>
              <div class="detail-item">
                <label>文件ID：</label>
                <span>{{ selectedSubmission?.fileId }}</span>
              </div>
            </el-col>
          </el-row>
          <div class="detail-actions">
            <el-button 
              type="primary" 
              @click="downloadSubmission(selectedSubmission)"
              v-if="selectedSubmission"
            >
              <i class="el-icon-download"></i>
              下载文件
            </el-button>
          </div>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus';
import { getCurrentUser, logoutUser } from '../services/userService';
import { getAllAssignments } from '../services/assignmentService';
import { getAllSubmissions, deleteSubmission as deleteSubmissionAPI, downloadFile } from '../services/submissionService';

export default {
  name: 'SubmissionManagementView',
  setup() {
    // 用户信息
    const userInfo = ref(getCurrentUser());
    
    // 数据加载状态
    const loading = ref(false);
    const downloadingIds = ref([]);
    const deletingIds = ref([]);
    
    // 数据源
    const allSubmissions = ref([]);
    const allAssignments = ref([]);
    const allUsers = ref([]);
    
    // 筛选条件
    const assignmentFilter = ref('all');
    const statusFilter = ref('all');
    const classFilter = ref('all');
    const searchKeyword = ref('');
    
    // 分页
    const currentPage = ref(1);
    const pageSize = ref(20);
    
    // 选中的提交
    const selectedSubmissions = ref([]);
    
    // 详情对话框
    const detailDialogVisible = ref(false);
    const selectedSubmission = ref(null);
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };
    
    // 格式化文件大小
    const formatFileSize = (sizeInBytes) => {
      if (!sizeInBytes) return '0 B';
      
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      let size = sizeInBytes;
      let unitIndex = 0;
      
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }
      
      return `${size.toFixed(2)} ${units[unitIndex]}`;
    };
    
    // 获取逾期时长文本
    const getLateTimeText = (submission) => {
      if (!submission || submission.status !== 'late' || !submission.deadline || !submission.submitTime) {
        return '0分钟';
      }
      
      const deadline = new Date(submission.deadline);
      const submitTime = new Date(submission.submitTime);
      const diffMinutes = Math.floor((submitTime - deadline) / (1000 * 60));
      
      if (diffMinutes < 60) {
        return `${diffMinutes}分钟`;
      } else if (diffMinutes < 1440) {
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
      } else {
        const days = Math.floor(diffMinutes / 1440);
        const remainingHours = Math.floor((diffMinutes % 1440) / 60);
        return remainingHours > 0 ? `${days}天${remainingHours}小时` : `${days}天`;
      }
    };
    
    // 唯一班级列表
    const uniqueClasses = computed(() => {
      const classes = [...new Set(allSubmissions.value.map(s => s.className).filter(Boolean))];
      return classes.sort();
    });
    
    // 过滤后的提交列表
    const filteredSubmissions = computed(() => {
      let filtered = [...allSubmissions.value];
      
      // 按作业筛选
      if (assignmentFilter.value !== 'all') {
        filtered = filtered.filter(sub => sub.assignmentId === assignmentFilter.value);
      }
      
      // 按状态筛选
      if (statusFilter.value !== 'all') {
        filtered = filtered.filter(sub => sub.status === statusFilter.value);
      }
      
      // 按班级筛选
      if (classFilter.value !== 'all') {
        filtered = filtered.filter(sub => sub.className === classFilter.value);
      }
      
      // 按搜索关键词筛选
      if (searchKeyword.value.trim()) {
        const keyword = searchKeyword.value.trim().toLowerCase();
        filtered = filtered.filter(sub => 
          sub.studentId.toLowerCase().includes(keyword) ||
          sub.studentName.toLowerCase().includes(keyword) ||
          sub.fileName.toLowerCase().includes(keyword)
        );
      }
      
      // 按提交时间倒序排序
      return filtered.sort((a, b) => new Date(b.submitTime) - new Date(a.submitTime));
    });
    
    // 分页后的提交列表
    const paginatedSubmissions = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      return filteredSubmissions.value.slice(start, end);
    });
    
    // 统计数据
    const totalSubmissions = computed(() => allSubmissions.value.length);
    const onTimeSubmissions = computed(() => allSubmissions.value.filter(sub => sub.status === 'submitted').length);
    const lateSubmissions = computed(() => allSubmissions.value.filter(sub => sub.status === 'late').length);
    const uniqueSubmitters = computed(() => new Set(allSubmissions.value.map(sub => sub.studentId)).size);
    
    // 加载数据
    const loadData = async () => {
      loading.value = true;
      try {
        // 获取所有提交
        const submissions = await getAllSubmissions();
        
        // 获取所有作业
        const assignments = await getAllAssignments();
        allAssignments.value = assignments;
        
        // 增强提交数据
        allSubmissions.value = submissions.map(submission => {
          const assignment = assignments.find(a => a.id === submission.assignmentId);
          return {
            ...submission,
            assignmentTitle: assignment?.title || '未知作业',
            deadline: assignment?.deadline,
            fileName: submission.fileName,
            fileSize: submission.fileSize || 0,
            fileType: submission.fileName ? submission.fileName.split('.').pop().toUpperCase() : '',
            className: submission.className || '未知班级'
          };
        });
        
        // 清空筛选条件
        assignmentFilter.value = 'all';
        statusFilter.value = 'all';
        classFilter.value = 'all';
        searchKeyword.value = '';
        currentPage.value = 1;
      } catch (error) {
        ElMessage.error('加载数据失败，请重试');
        console.error('加载数据失败:', error);
      } finally {
        loading.value = false;
      }
    };
    

    
    // 退出登录
    const handleLogout = () => {
      logoutUser();
    };
    
    // 跳转到个人中心
    const goToProfile = () => {
      window.location.href = '/profile';
    };
    
    // 跳转到作业详情
    const goToAssignmentDetail = (assignmentId) => {
      window.location.href = `/assignments/${assignmentId}`;
    };
    
    // 处理筛选条件变化
    const handleAssignmentFilterChange = () => {
      currentPage.value = 1;
    };
    
    const handleStatusFilterChange = () => {
      currentPage.value = 1;
    };
    
    const handleClassFilterChange = () => {
      currentPage.value = 1;
    };
    
    // 处理搜索
    const handleSearch = () => {
      currentPage.value = 1;
    };
    
    // 刷新数据
    const refreshData = () => {
      loadData();
    };
    
    // 处理表格选择变化
    const handleSelectionChange = (selection) => {
      selectedSubmissions.value = selection;
    };
    
    // 分页处理
    const handleSizeChange = (size) => {
      pageSize.value = size;
      currentPage.value = 1;
    };
    
    const handleCurrentChange = (current) => {
      currentPage.value = current;
    };
    
    // 下载提交文件
    const downloadSubmission = async (submission) => {
      if (!submission || !submission.fileId || !submission.fileName) {
        ElMessage.warning('文件信息不完整，无法下载');
        return;
      }
      
      downloadingIds.value.push(submission.id);
      try {
        await downloadFile(submission.fileId, submission.fileName);
        ElMessage.success(`文件「${submission.fileName}」下载成功`);
      } catch (error) {
        ElMessage.error(`文件「${submission.fileName}」下载失败`);
        console.error('文件下载失败:', error);
      } finally {
        downloadingIds.value = downloadingIds.value.filter(id => id !== submission.id);
      }
    };
    
    // 批量下载
    const batchDownload = async () => {
      if (selectedSubmissions.value.length === 0) {
        ElMessage.warning('请选择要下载的文件');
        return;
      }
      
      const loadingInstance = ElLoading.service({
        lock: true,
        text: '正在准备批量下载...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      });
      
      try {
        // 这里应该实现批量下载逻辑，目前简单地逐个下载
        // 注意：真实环境中应该考虑服务器端打包下载以提高效率
        for (const submission of selectedSubmissions.value) {
          await downloadFile(submission.fileId, submission.fileName);
        }
        
        ElMessage.success(`成功下载 ${selectedSubmissions.value.length} 个文件`);
      } catch (error) {
        ElMessage.error('批量下载失败，请重试');
        console.error('批量下载失败:', error);
      } finally {
        loadingInstance.close();
      }
    };
    
    // 删除单个提交
    const deleteSubmission = async (submissionId, studentName, assignmentTitle) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除用户「${studentName}」的作业「${assignmentTitle}」提交记录吗？删除后将无法恢复。`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        
        deletingIds.value.push(submissionId);
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
      } finally {
        deletingIds.value = deletingIds.value.filter(id => id !== submissionId);
      }
    };
    
    // 批量删除
    const batchDelete = async () => {
      if (selectedSubmissions.value.length === 0) {
        ElMessage.warning('请选择要删除的提交记录');
        return;
      }
      
      try {
        await ElMessageBox.confirm(
          `确定要删除选中的 ${selectedSubmissions.value.length} 条提交记录吗？删除后将无法恢复。`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        
        const loadingInstance = ElLoading.service({
          lock: true,
          text: '正在批量删除...',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        });
        
        // 批量删除提交记录
        const promises = selectedSubmissions.value.map(submission => {
          deletingIds.value.push(submission.id);
          return deleteSubmissionAPI(submission.id).finally(() => {
            deletingIds.value = deletingIds.value.filter(id => id !== submission.id);
          });
        });
        
        await Promise.all(promises);
        
        ElMessage.success(`成功删除 ${selectedSubmissions.value.length} 条提交记录`);
        
        // 重新加载数据
        loadData();
      } catch (error) {
        // 用户取消删除不会抛出错误，只有真正的错误才会显示提示
        if (error !== 'cancel') {
          ElMessage.error('批量删除失败，请重试');
          console.error('批量删除失败:', error);
        }
      } finally {
        loadingInstance?.close();
      }
    };
    
    // 查看提交详情
    const viewSubmissionDetail = (submission) => {
      selectedSubmission.value = submission;
      detailDialogVisible.value = true;
    };
    
    // 组件挂载时加载数据
    onMounted(() => {
      loadData();
    });
    
    return {
      userInfo,
      loading,
      downloadingIds,
      deletingIds,
      allSubmissions,
      allAssignments,
      assignmentFilter,
      statusFilter,
      classFilter,
      searchKeyword,
      currentPage,
      pageSize,
      selectedSubmissions,
      detailDialogVisible,
      selectedSubmission,
      uniqueClasses,
      filteredSubmissions,
      paginatedSubmissions,
      totalSubmissions,
      onTimeSubmissions,
      lateSubmissions,
      uniqueSubmitters,
      formatDate,
      formatFileSize,
      getLateTimeText,
      handleLogout,
      goToProfile,
      goToAssignmentDetail,
      handleAssignmentFilterChange,
      handleStatusFilterChange,
      handleClassFilterChange,
      handleSearch,
      refreshData,
      handleSelectionChange,
      handleSizeChange,
      handleCurrentChange,
      downloadSubmission,
      batchDownload,
      deleteSubmission,
      batchDelete,
      viewSubmissionDetail
    };
  }
};
</script>

<style scoped>
.submission-management-container {
  background-color: #f5f7fa;
  padding: 20px;
  min-height: calc(100vh - 60px); /* 考虑Header高度 */
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  color: #303133;
  margin: 0;
}

.filters-container {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  height: 100px;
}

.stat-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.stat-icon {
  font-size: 36px;
  color: #1890ff;
}

.stat-info {
  text-align: left;
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

.submission-table-container {
  background-color: white;
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
}

/* 文件详情弹出框 */
.file-info {
  font-size: 14px;
  line-height: 1.8;
}

/* 提交详情对话框 */
.submission-detail {
  font-size: 14px;
}

.detail-item {
  margin-bottom: 15px;
}

.detail-item label {
  font-weight: bold;
  color: #606266;
  margin-right: 10px;
}

.detail-item span {
  color: #303133;
}

.file-detail {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.file-detail h4 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #303133;
}

.detail-actions {
  margin-top: 20px;
  text-align: right;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .filters-container .el-row {
    flex-direction: column;
  }
  
  .filters-container .el-col {
    width: 100% !important;
    margin-bottom: 10px;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons .el-button {
    width: 100%;
  }
}
</style>
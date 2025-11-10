<template>
  <div class="recent-assignments-section">
    <h2>近期作业</h2>
    <el-table :data="recentAssignments" style="width: 100%">
      <el-table-column prop="title" label="作业名称" max-width="200px"></el-table-column>
      <el-table-column prop="deadline" label="截止日期">
          <template #default="{ row }">
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
      <el-table-column prop="status" label="状态">
            <template #default="{ row }">
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
      <el-table-column label="操作" fixed="right">
        <template #default="{ row }">
          <div v-if="row && row.id">
            <el-button 
              type="primary" 
              size="small" 
              @click="goToDetail(row.id)"
            >
              详情
            </el-button>
          </div>
          <span v-else>-</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { CircleClose } from '@element-plus/icons-vue';

export default {
  name: 'RecentAssignmentsSection',
  components: {
    CircleClose
  },
  props: {
    recentAssignments: {
      type: Array,
      required: true
    }
  },
  setup(props, { emit }) {
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };
    
    // 检查作业是否紧急（24小时内截止）
    const isAssignmentUrgent = (deadline) => {
      if (!deadline) return false;
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const diffMs = deadlineDate - now;
      const diffHours = diffMs / (1000 * 60 * 60);
      return diffHours > 0 && diffHours < 24;
    };
    
    // 检查作业是否已过期
    const isAssignmentExpired = (deadline) => {
      if (!deadline) return false;
      const now = new Date();
      const deadlineDate = new Date(deadline);
      return deadlineDate < now;
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
      if (row.deadline && isAssignmentUrgent(row.deadline)) {
        return { type: 'warning', text: '未提交(紧急)', key: 'notSubmittedUrgent' };
      }
      return { type: 'info', text: '未提交', key: 'default' };
    };
    
    // 跳转到作业详情
    const goToDetail = (id) => {
      emit('go-to-detail', id);
    };
    
    return {
      formatDate,
      isAssignmentExpired,
      isAssignmentUrgent,
      getStatusTag,
      goToDetail
    };
  }
};
</script>

<style scoped>
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

/* 状态文本样式 */
.text-danger {
  color: #f56c6c;
}

.text-warning {
  color: #e6a23c;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .recent-assignments-section {
    padding: 20px 15px;
    width: 100%;
  }
  
  .el-table {
    width: 100%;
    overflow-x: auto;
  }
}
</style>
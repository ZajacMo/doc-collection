<template>
  <div class="table-section">
    <el-table 
      :data="assignments" 
      style="width: 100%"
      stripe
      border
      max-height="600"
    >
      <el-table-column type="index" label="序号" min-width="40" align="center"></el-table-column>
      <el-table-column prop="title" label="作业名称" min-width="100" align="center"></el-table-column>
      <el-table-column prop="createTime" label="创建时间" min-width="140" align="center">
        <template v-slot="{ row }">
          {{ row && row.createTime ? formatDate(row.createTime) : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="deadline" label="截止日期" min-width="140" align="center">
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
      <el-table-column prop="status" label="我的状态" align="center">
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
      <el-table-column label="操作"  fixed="right" align="center">
        <template v-slot="{ row }">
          <div v-if="row && row.id">
            <el-button 
              type="primary" 
              size="small" 
              @click="onDetailClick(row.id)"
            >
              详情
            </el-button>
            <el-button 
              v-if="userInfo?.role === 'admin'"
              type="danger" 
              size="small" 
              @click="onDeleteClick(row.id, row.title)"
            >
              删除
            </el-button>
          </div>
          <span v-else>-</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { isAssignmentExpired } from '../../services/assignmentService';

export default defineComponent({
  name: 'AssignmentTable',
  props: {
    assignments: {
      type: Array,
      default: () => []
    },
    userInfo: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['detail', 'delete'],
  setup(props, { emit }) {
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };
    
    // 检查作业是否紧急（24小时内截止）
    const isAssignmentUrgent = (deadline) => {
      if (!deadline) return false;
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const diff = deadlineDate - now;
      return diff > 0 && diff < 24 * 60 * 60 * 1000;
    };

    const onDetailClick = (id) => {
      emit('detail', id);
    };

    const onDeleteClick = (id, title) => {
      emit('delete', { id, title });
    };

    return {
      formatDate,
      isAssignmentUrgent,
      isAssignmentExpired,
      onDetailClick,
      onDeleteClick
    };
  }
});
</script>

<style scoped>
.table-section {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

/* 移动端响应式样式 */
@media screen and (max-width: 768px) {
  .table-section {
    padding: 15px;
  }
}

.text-danger {
  color: #f56c6c;
}

.text-warning {
  color: #e6a23c;
}

.assignment-title-link {
  cursor: pointer;
  color: #1890ff;
}

.assignment-title-link:hover {
  text-decoration: underline;
}
</style>
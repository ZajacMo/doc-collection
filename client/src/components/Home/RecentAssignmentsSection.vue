<template>
  <div class="recent-assignments-section">
    <div class="section-header">
      <h2>近期作业</h2>
      <el-tag type="info" effect="plain" size="small">最近 5 项</el-tag>
    </div>
    <el-table :data="recentAssignments" style="width: 100%" stripe>
      <el-table-column prop="title" label="作业名称" align="left">
        <template #default="{ row }">
          <div class="assignment-name">
            <el-icon :size="16" class="name-icon"><Document /></el-icon>
            <span>{{ row.title }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="deadline" label="截止日期" align="center" min-width="140">
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
      <el-table-column prop="status" label="状态" align="center" width="120">
        <template #default="{ row }">
          <div>
            <el-tag
              :type="getStatusTag(row).type"
              :key="getStatusTag(row).key"
              effect="light"
              size="small"
              class="status-tag"
            >
              {{ getStatusTag(row).text }}
            </el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" align="center" width="90">
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

<script setup>
import { formatDate } from "@/utils/date";
import { Document } from '@element-plus/icons-vue';

const props = defineProps({
  recentAssignments: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['go-to-detail']);

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
</script>

<style scoped>
.recent-assignments-section {
  background-color: var(--bg-card);
  padding: 24px;
  border-radius: var(--radius-md);
  margin-bottom: 20px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-card);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.recent-assignments-section h2 {
  color: var(--text-primary);
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.assignment-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.name-icon {
  color: var(--color-primary);
}

.status-tag {
  font-weight: 500;
}

/* 状态文本样式 */
.text-danger {
  color: var(--color-danger);
  font-weight: 500;
}

.text-warning {
  color: var(--color-warning);
  font-weight: 500;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .recent-assignments-section {
    padding: 16px 12px;
    width: 100%;
  }

  .el-table {
    width: 100%;
    overflow-x: auto;
  }
}
</style>

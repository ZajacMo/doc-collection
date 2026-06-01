<template>
  <div class="recent-submissions">
    <div class="section-header">
      <h3>最近提交记录</h3>
      <el-tag type="info" effect="plain" size="small">最近 5 条</el-tag>
    </div>
    <el-table
      :data="recentSubmissionsData"
      style="width: 100%"
      stripe
    >
      <el-table-column prop="assignmentTitle" label="作业名称" align="left">
        <template #default="scope">
          <div class="assignment-name">
            <el-icon :size="16" class="name-icon"><DocumentChecked /></el-icon>
            <span>{{ scope.row.assignmentTitle }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="submitTime" label="提交时间" min-width="140" align="center">
        <template #default="scope">
          {{ formatDate(scope.row.submitTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="fileName" label="文件名" min-width="180" align="left">
        <template #default="scope">
          <div class="file-name">
            <el-icon :size="14" class="file-icon"><Document /></el-icon>
            <span class="file-name-text">{{ scope.row.fileName }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" align="center" width="100">
        <template #default="scope">
          <el-tag
            v-if="scope.row.status === 'submitted'"
            type="success"
            effect="light"
            size="small"
            class="status-tag"
          >
            已提交
          </el-tag>
          <el-tag
            v-if="scope.row.status === 'late'"
            type="danger"
            effect="light"
            size="small"
            class="status-tag"
          >
            已逾期
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="80" fixed="right" align="center">
        <template #default="scope">
          <el-button
            type="primary"
            size="small"
            text
            @click="goToDetail(scope.row.assignmentId)"
          >
            查看
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { formatDate } from "@/utils/date";
import { DocumentChecked, Document } from '@element-plus/icons-vue';

const props = defineProps({
  recentSubmissionsData: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['go-to-detail']);

// 跳转到作业详情
const goToDetail = (assignmentId) => {
  emit('go-to-detail', assignmentId);
};
</script>

<style scoped>
.recent-submissions {
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

.recent-submissions h3 {
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
  color: var(--color-success);
}

.file-name {
  display: flex;
  align-items: center;
  gap: 6px;
}

.file-icon {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.file-name-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.status-tag {
  font-weight: 500;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .recent-submissions {
    padding: 16px 12px;
    width: 100%;
  }

  .el-table {
    width: 100%;
    overflow-x: auto;
  }

  .file-name-text {
    max-width: 120px;
  }
}
</style>

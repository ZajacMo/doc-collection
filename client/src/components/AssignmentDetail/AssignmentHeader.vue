<template>
  <div class="assignment-header">
    <div class="title-section">
      <el-icon :size="20" class="header-icon"><Document /></el-icon>
      <h1 class="assignment-title">{{ assignment.title }}</h1>
    </div>
    <el-tag
      :type="statusType"
      size="large"
      effect="light"
      class="status-tag"
      round
    >
      {{ statusText }}
    </el-tag>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Document } from '@element-plus/icons-vue';

const props = defineProps({
  assignment: {
    type: Object,
    required: true
  },
  status: {
    type: String,
    required: true,
    validator: (value) => {
      return ['submitted', 'late', 'expired', 'urgent', 'in_progress'].includes(value);
    }
  }
});

// 根据状态计算标签类型
const statusType = computed(() => {
  const typeMap = {
    'submitted': 'success',
    'late': 'danger',
    'expired': 'info',
    'urgent': 'warning',
    'in_progress': 'info'
  };
  return typeMap[props.status] || 'info';
});

// 根据状态计算显示文本
const statusText = computed(() => {
  const textMap = {
    'submitted': '已提交',
    'late': '已逾期',
    'expired': '已截止',
    'urgent': '紧急',
    'in_progress': '进行中'
  };
  return textMap[props.status] || '进行中';
});
</script>

<style scoped>
.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.header-icon {
  color: var(--color-primary);
  flex-shrink: 0;
}

.assignment-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.status-tag {
  font-weight: 600;
  font-size: 14px;
}

@media (max-width: 768px) {
  .assignment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>

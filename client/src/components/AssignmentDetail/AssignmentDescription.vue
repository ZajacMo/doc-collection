<template>
  <div class="assignment-description">
    <div class="section-title">
      <el-icon :size="18"><Document /></el-icon>
      <h3>作业描述</h3>
    </div>
    <div class="description-content">
      <p>{{ assignment.description || '暂无描述' }}</p>
    </div>
  </div>
</template>

<script setup>
import { Document } from '@element-plus/icons-vue';

const props = defineProps({
  assignment: {
    type: Object,
    required: true
  }
});
</script>

<style scoped>
.assignment-description {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.section-title h3 {
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.section-title .el-icon {
  color: var(--color-primary);
}

.description-content {
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  padding: 16px 20px;
}

.description-content p {
  color: var(--text-secondary);
  line-height: 1.8;
  font-size: 14px;
  white-space: pre-wrap;
  margin: 0;
}
</style>

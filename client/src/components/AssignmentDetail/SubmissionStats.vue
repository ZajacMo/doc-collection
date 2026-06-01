<template>
  <div class="submission-stats">
    <div class="section-title">
      <el-icon :size="18"><DataLine /></el-icon>
      <h3>提交情况统计</h3>
    </div>
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon icon-total"><User /></div>
        <div class="stat-number">{{ totalStudents }}</div>
        <div class="stat-label">总人数</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon icon-submitted"><CircleCheck /></div>
        <div class="stat-number">{{ submittedCount }}</div>
        <div class="stat-label">已提交</div>
        <div class="stat-badge badge-success">{{ submittedPercentage }}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon icon-pending"><CircleClose /></div>
        <div class="stat-number">{{ pendingCount }}</div>
        <div class="stat-label">未提交</div>
        <div class="stat-badge badge-danger">{{ pendingPercentage }}%</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { DataLine, User, CircleCheck, CircleClose } from '@element-plus/icons-vue';

const props = defineProps({
  totalStudents: {
    type: Number,
    required: true
  },
  submittedCount: {
    type: Number,
    required: true
  }
});

const pendingCount = computed(() => props.totalStudents - props.submittedCount);

const submittedPercentage = computed(() =>
  props.totalStudents > 0 ? Math.round((props.submittedCount / props.totalStudents) * 100) : 0
);

const pendingPercentage = computed(() => 100 - submittedPercentage.value);
</script>

<style scoped>
.submission-stats {
  background-color: var(--bg-card);
  padding: 24px;
  border-radius: var(--radius-md);
  margin-bottom: 20px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-card);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
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

.stats-cards {
  display: flex;
  gap: 16px;
}

.stat-card {
  flex: 1;
  min-width: 140px;
  text-align: center;
  padding: 20px 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  font-size: 20px;
}

.icon-total {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
}

.icon-submitted {
  background: linear-gradient(135deg, #10b981, #06b6d4);
  color: white;
}

.icon-pending {
  background: linear-gradient(135deg, #f43f5e, #ec4899);
  color: white;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 8px;
}

.stat-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.badge-success {
  background: var(--color-success-light);
  color: var(--color-success);
}

.badge-danger {
  background: var(--color-danger-light);
  color: var(--color-danger);
}

@media (max-width: 768px) {
  .submission-stats {
    padding: 16px 12px;
  }

  .stats-cards {
    flex-direction: column;
  }
}
</style>

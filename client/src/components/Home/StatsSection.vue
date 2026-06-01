<template>
  <div class="overview-section">
    <div class="section-header">
      <h2>作业概览</h2>
    </div>
    <div class="overview-cards">
      <el-card
        v-for="(card, index) in statsCards"
        :key="index"
        class="overview-card"
        :class="`card-${index}`"
      >
        <div class="card-content">
          <div class="card-icon" :class="`icon-${index}`">
            <el-icon :size="24">
              <component :is="getIcon(index)" />
            </el-icon>
          </div>
          <div class="card-info">
            <div class="card-number">{{ card.value }}</div>
            <div class="card-label">{{ card.label }}</div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { Document, Timer, AlarmClock, Warning } from '@element-plus/icons-vue';

defineProps({
  statsCards: {
    type: Array,
    required: true
  }
});

const getIcon = (index) => {
  const icons = [Document, Timer, AlarmClock, Warning];
  return icons[index] || Document;
};
</script>

<style scoped>
.overview-section {
  margin-bottom: 24px;
}

.section-header {
  margin-bottom: 16px;
}

.section-header h2 {
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.overview-card {
  background-color: var(--bg-card);
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
}

.overview-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card-hover);
}

:deep(.overview-card .el-card__body) {
  padding: 20px;
}

.card-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-0 {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
}

.icon-1 {
  background: linear-gradient(135deg, #06b6d4 0%, #6366f1 100%);
  color: white;
}

.icon-2 {
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
  color: white;
}

.icon-3 {
  background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%);
  color: white;
}

.card-info {
  flex: 1;
}

.card-number {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
  margin-bottom: 4px;
}

.card-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .overview-cards {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .card-number {
    font-size: 22px;
  }
}

@media (max-width: 480px) {
  .overview-cards {
    grid-template-columns: 1fr;
  }
}
</style>

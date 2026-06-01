<template>
  <div class="overview-section">
    <div class="overview-cards">
      <div class="stat-card" v-for="(stat, index) in statsData" :key="index">
        <div class="stat-icon" :class="`icon-${index}`">
          <el-icon :size="24">
            <component :is="stat.icon" />
          </el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-number">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </div>

    <!-- 近期活动 -->
    <div class="recent-activities">
      <div class="section-header">
        <el-icon :size="18" class="section-icon"><Clock /></el-icon>
        <h3>近期活动</h3>
      </div>
      <el-table
        :data="recentActivitiesData"
        style="width: 100%"
        stripe
        max-height="400"
      >
        <el-table-column prop="time" label="时间" min-width="140">
          <template #default="{ row }">
            {{ row && row.time ? formatDate(row.time) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="user" label="用户" min-width="100"></el-table-column>
        <el-table-column prop="action" label="操作" min-width="120"></el-table-column>
        <el-table-column prop="details" label="详情" min-width="180"></el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatDate } from "@/utils/date";
import { User, Document, Upload, Timer, Clock } from '@element-plus/icons-vue';

const props = defineProps({
  totalStudents: {
    type: Number,
    default: 0
  },
  totalAssignments: {
    type: Number,
    default: 0
  },
  totalSubmissions: {
    type: Number,
    default: 0
  },
  pendingAssignments: {
    type: Number,
    default: 0
  },
  recentActivitiesData: {
    type: Array,
    default: () => []
  }
});

const statsData = computed(() => [
  { icon: User, value: props.totalStudents, label: '总学生数' },
  { icon: Document, value: props.totalAssignments, label: '总作业数' },
  { icon: Upload, value: props.totalSubmissions, label: '总提交数' },
  { icon: Timer, value: props.pendingAssignments, label: '待截止作业' }
]);
</script>

<style scoped>
.overview-section {
  padding: 8px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-card);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-card-hover);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
}

.icon-0 {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
}

.icon-1 {
  background: linear-gradient(135deg, #06b6d4, #6366f1);
}

.icon-2 {
  background: linear-gradient(135deg, #10b981, #06b6d4);
}

.icon-3 {
  background: linear-gradient(135deg, #f59e0b, #f97316);
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.recent-activities {
  margin-top: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.section-header h3 {
  color: var(--text-primary);
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.section-icon {
  color: var(--color-primary);
}

@media (max-width: 768px) {
  .overview-cards {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 480px) {
  .overview-cards {
    grid-template-columns: 1fr;
  }
}
</style>

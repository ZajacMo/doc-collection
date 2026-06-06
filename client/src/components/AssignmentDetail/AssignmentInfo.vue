<template>
  <div class="assignment-info">
    <div class="info-grid">
      <div class="info-item">
        <div class="info-icon"><Clock /></div>
        <div class="info-content">
          <div class="info-label">创建时间</div>
          <div class="info-value">{{ formatDate(assignment.createTime) }}</div>
        </div>
      </div>
      <div class="info-item">
        <div class="info-icon icon-deadline"><Calendar /></div>
        <div class="info-content">
          <div class="info-label">截止日期</div>
          <div class="info-value" :class="{
            'text-danger': isAssignmentExpired(assignment.deadline),
            'text-warning': isAssignmentUrgent(assignment.deadline)
          }">
            {{ formatDate(assignment.deadline) }}
          </div>
        </div>
      </div>
      <div class="info-item">
        <div class="info-icon icon-creator"><User /></div>
        <div class="info-content">
          <div class="info-label">创建者</div>
          <div class="info-value">{{ assignment.creator || '管理员' }}</div>
        </div>
      </div>
      <div class="info-item">
        <div class="info-icon icon-file-size"><Document /></div>
        <div class="info-content">
          <div class="info-label">文件大小限制</div>
          <div class="info-value">{{ assignment.maxFileSize || 20 }}MB</div>
        </div>
      </div>
    </div>
    <div v-if="!isAssignmentExpired(assignment.deadline)" class="countdown-bar">
      <el-icon :size="16"><Timer /></el-icon>
      <span>剩余时间：{{ getCountdown(assignment.deadline) }}</span>
    </div>
  </div>
</template>

<script setup>
import { formatDate } from "@/utils/date";
import { isAssignmentExpired } from "../../services/assignmentService";
import { Clock, Calendar, User, Timer, Document } from '@element-plus/icons-vue';

defineProps({
  assignment: {
    type: Object,
    required: true
  }
});

// 检查作业是否紧急（24小时内截止且未过期）
const isAssignmentUrgent = (deadline) => {
  if (!deadline) return false;
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate - now;
  return diff > 0 && diff < 24 * 60 * 60 * 1000;
};

// 计算剩余时间（X天X小时X分钟）
const getCountdown = (deadline) => {
  if (!deadline) return '无截止日期';
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate - now;

  if (diff <= 0) return '已截止';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}天${hours}小时${minutes}分钟`;
  if (hours > 0) return `${hours}小时${minutes}分钟`;
  return `${minutes}分钟`;
};
</script>

<style scoped>
.assignment-info {
  margin-bottom: 24px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

.info-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.icon-deadline {
  background: linear-gradient(135deg, #f59e0b, #f97316);
}

.icon-creator {
  background: linear-gradient(135deg, #06b6d4, #6366f1);
}

.icon-file-size {
  background: linear-gradient(135deg, #10b981, #06b6d4);
}

.info-label {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-bottom: 2px;
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 600;
}

.countdown-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--color-primary-lighter);
  border-radius: var(--radius-sm);
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 500;
}

.text-danger {
  color: var(--color-danger);
}

.text-warning {
  color: var(--color-warning);
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>

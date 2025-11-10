<template>
  <div class="assignment-info">
    <div class="info-row">
      <div class="info-label">创建时间：</div>
      <div class="info-value">{{ formatDate(assignment.createTime) }}</div>
    </div>
    <div class="info-row">
      <div class="info-label">截止日期：</div>
      <div class="info-value" :class="{
        'text-danger': isAssignmentExpired(assignment.deadline),
        'text-warning': isAssignmentUrgent(assignment.deadline)
      }">
        {{ formatDate(assignment.deadline) }}
        <span v-if="!isAssignmentExpired(assignment.deadline)" class="countdown">
          （剩余：{{ getCountdown(assignment.deadline) }}）
        </span>
      </div>
    </div>
    <div class="info-row">
      <div class="info-label">创建者：</div>
      <div class="info-value">{{ assignment.creator || '管理员' }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AssignmentInfo',
  props: {
    assignment: {
      type: Object,
      required: true
    }
  },
  methods: {
    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    },
    
    // 检查作业是否已过期
    isAssignmentExpired(deadline) {
      if (!deadline) return false;
      return new Date() > new Date(deadline);
    },
    
    // 检查作业是否紧急（24小时内截止）
    isAssignmentUrgent(deadline) {
      if (!deadline) return false;
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const diff = deadlineDate - now;
      return diff > 0 && diff < 24 * 60 * 60 * 1000;
    },
    
    // 计算剩余时间
    getCountdown(deadline) {
      if (!deadline) return '';
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const diff = deadlineDate - now;
      
      if (diff <= 0) return '已逾期';
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        return `${days}天${hours}小时`;
      } else if (hours > 0) {
        return `${hours}小时${minutes}分钟`;
      } else {
        return `${minutes}分钟`;
      }
    }
  }
};
</script>

<style scoped>
.assignment-info {
  margin-bottom: 30px;
}

.info-row {
  display: flex;
  margin-bottom: 15px;
  align-items: center;
}

.info-label {
  width: 100px;
  color: #606266;
  font-weight: bold;
}

.info-value {
  color: #303133;
  font-size: 15px;
}

.countdown {
  font-size: 13px;
  color: #909399;
  margin-left: 10px;
}

.text-danger {
  color: #f56c6c;
}

.text-warning {
  color: #e6a23c;
}
</style>
<template>
  <div v-if="shouldShowNotice" class="notice-card">
    <div class="notice-inner" :class="`notice-${alertConfig.type}`">
      <div class="notice-icon">
        <el-icon :size="20"><component :is="alertConfig.icon" /></el-icon>
      </div>
      <div class="notice-body">
        <div class="notice-title">{{ alertConfig.title }}</div>
        <div class="notice-desc">{{ alertConfig.description }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { CircleCheck, Warning, Clock, CircleClose } from '@element-plus/icons-vue';

const props = defineProps({
  assignmentStatus: {
    type: String,
    required: true,
    validator: (value) => {
      return ['submitted', 'in_progress', 'urgent', 'expired', 'late'].includes(value);
    }
  }
});

const shouldShowNotice = computed(() => {
  return ['submitted', 'urgent', 'expired', 'late'].includes(props.assignmentStatus);
});

const alertConfig = computed(() => {
  const configs = {
    'submitted': {
      type: 'success',
      icon: CircleCheck,
      title: '作业已提交',
      description: '您已成功提交作业，如需修改请重新上传文件。'
    },
    'urgent': {
      type: 'warning',
      icon: Warning,
      title: '作业即将截止',
      description: '距离截止日期已不足24小时，请尽快提交作业！'
    },
    'expired': {
      type: 'info',
      icon: Clock,
      title: '作业已截止',
      description: '该作业已过截止日期，无法继续提交。'
    },
    'late': {
      type: 'danger',
      icon: CircleClose,
      title: '作业已逾期',
      description: '您未能在截止日期前提交作业，请联系老师处理。'
    }
  };
  return configs[props.assignmentStatus] || configs['in_progress'];
});
</script>

<style scoped>
.notice-card {
  margin-bottom: 20px;
}

.notice-inner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
}

.notice-success {
  background: var(--color-success-light);
  border-color: rgba(16, 185, 129, 0.2);
}

.notice-success .notice-icon {
  color: var(--color-success);
}

.notice-warning {
  background: var(--color-warning-light);
  border-color: rgba(245, 158, 11, 0.2);
}

.notice-warning .notice-icon {
  color: var(--color-warning);
}

.notice-danger {
  background: var(--color-danger-light);
  border-color: rgba(244, 63, 94, 0.2);
}

.notice-danger .notice-icon {
  color: var(--color-danger);
}

.notice-info {
  background: var(--color-primary-lighter);
  border-color: rgba(99, 102, 241, 0.15);
}

.notice-info .notice-icon {
  color: var(--color-primary);
}

.notice-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.notice-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.notice-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}
</style>

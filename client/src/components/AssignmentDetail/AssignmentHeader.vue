<template>
  <div class="assignment-header">
    <h1 class="assignment-title">{{ assignment.title }}</h1>
    <el-tag 
      :type="statusType"
      size="large"
    >
      {{ statusText }}
    </el-tag>
  </div>
</template>

<script>
export default {
  name: 'AssignmentHeader',
  props: {
    assignment: {
      type: Object,
      required: true
    },
    status: {
      type: String,
      required: true,
      validator: (value) => {
        // 验证状态值是否有效
        return ['submitted', 'late', 'expired', 'urgent', 'in_progress'].includes(value);
      }
    }
  },
  computed: {
    // 根据状态计算标签类型
    statusType() {
      const typeMap = {
        'submitted': 'success',
        'late': 'danger',
        'expired': 'success',
        'urgent': 'warning',
        'in_progress': 'info'
      };
      return typeMap[this.status] || 'info';
    },
    // 根据状态计算显示文本
    statusText() {
      const textMap = {
        'submitted': '已提交',
        'late': '已逾期',
        'expired': '已完结',
        'urgent': '紧急',
        'in_progress': '进行中'
      };
      return textMap[this.status] || '进行中';
    }
  }
};
</script>

<style scoped>
.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.assignment-title {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin: 0;
  flex: 1;
  margin-right: 20px;
}

@media (max-width: 768px) {
  .assignment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
}
</style>
<template>
  <!-- 根据assignmentStatus动态显示不同的通知内容 -->
  <div v-if="shouldShowNotice" class="notice-card">
    <el-card shadow="hover" :type="alertConfig.type">
      <div class="notice-content">
        <el-alert 
          :title="alertConfig.title"
          :type="alertConfig.type"
          :description="alertConfig.description"
          show-icon
          :closable="false"
        ></el-alert>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'NoticeCard',
  props: {
    // 作业状态，用于决定显示哪种通知
    assignmentStatus: {
      type: String,
      required: true,
      // 验证状态值是否有效
      validator: (value) => {
        return ['submitted', 'in_progress', 'urgent', 'expired', 'late'].includes(value);
      }
    }
  },
  computed: {
    // 判断是否应该显示通知
    shouldShowNotice() {
      // 当状态为expired或late时显示通知
      return ['expired', 'late'].includes(this.assignmentStatus);
    },
    // 根据状态配置不同的通知内容
    alertConfig() {
      // 通知配置映射
      const alertMap = {
        'expired': {
          title: '作业完结',
          type: 'success',
          description: '恭喜您，作业已完结。'
        },
        'late': {
          title: '作业已逾期提交',
          type: 'warning',
          description: '您的作业已逾期提交，可能会影响成绩评定。请关注后续成绩通知。'
        }
      };
      
      // 返回当前状态对应的配置，如果没有匹配则返回默认配置
      return alertMap[this.assignmentStatus] || {};
    }
  }
};
</script>

<style scoped>
.notice-card {
  margin-bottom: 20px;
}

.notice-content {
  padding: 10px 0;
}
</style>
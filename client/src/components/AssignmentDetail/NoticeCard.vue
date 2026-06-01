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

<script setup>

defineProps({
  // 作业状态，用于决定显示哪种通知
  assignmentStatus: {
    type: String,
    required: true,
    // 验证状态值是否有效
    validator: (value) => {
      return ['submitted', 'in_progress', 'urgent', 'expired', 'late'].includes(value);
    }
  }
});
</script>

<style scoped>
.notice-card {
  margin-bottom: 20px;
}

.notice-content {
  padding: 10px 0;
}
</style>
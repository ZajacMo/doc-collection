<template>
  <div class="welcome-section">
    <h1>欢迎回来！</h1>
    <p class="welcome-subtitle">今天是 {{ currentDate }}</p>
  </div>
</template>

<script>
export default {
  name: 'WelcomeSection',
  props: {
    currentDate: {
      type: String,
      required: true
    }
  }
};
</script>

<style scoped>
.welcome-section {
  margin-bottom: 30px;
}

.welcome-section h1 {
  color: #303133;
  margin-bottom: 10px;
}

.welcome-subtitle {
  color: #909399;
  font-size: 14px;
}
</style>
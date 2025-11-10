<template>
  <div class="expired-notice-card">
    <el-card shadow="hover" type="danger">
      <div class="expired-content">
        <el-alert 
          title="作业已过期"
          type="error"
          description="很遗憾，该作业已超过截止日期，无法再提交。请联系老师获取帮助。"
          show-icon
          :closable="false"
        ></el-alert>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'ExpiredNoticeCard'
};
</script>

<style scoped>
.expired-notice-card {
  margin-bottom: 20px;
}

.expired-content {
  padding: 10px 0;
}
</style>
<template>
  <div class="assignment-description">
    <h3>作业描述</h3>
    <p>{{ assignment.description || '暂无描述' }}</p>
  </div>
</template>

<script>
export default {
  name: 'AssignmentDescription',
  props: {
    assignment: {
      type: Object,
      required: true
    }
  }
};
</script>

<style scoped>
.assignment-description {
  margin-bottom: 30px;
}

.assignment-description h3 {
  color: #303133;
  margin-bottom: 15px;
  font-size: 18px;
}

.assignment-description p {
  color: #606266;
  line-height: 1.8;
  font-size: 15px;
  white-space: pre-wrap;
}
</style>
<template>
  <div class="page-header">
    <h2>作业</h2>
    <el-button 
      v-if="userInfo?.role === 'admin'" 
      type="primary" 
      @click="onCreateClick"
    >
      <i class="el-icon-plus"></i>
      创建作业
    </el-button>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'AssignmentListHeader',
  props: {
    userInfo: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['create'],
  setup(props, { emit }) {
    const onCreateClick = () => {
      emit('create');
    };

    return {
      onCreateClick
    };
  }
});
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  color: #303133;
  margin: 0;
}

/* 移动端响应式样式 */
@media screen and (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .page-header h2 {
    font-size: 18px;
  }
}
</style>
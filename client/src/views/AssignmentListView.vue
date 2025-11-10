<template>
  <AssignmentListContainer />
</template>

<script>
import { defineComponent } from 'vue';
import AssignmentListContainer from '../components/AssignmentList/AssignmentListContainer.vue';

export default defineComponent({
  name: 'AssignmentListView',
  components: {
    AssignmentListContainer
  }
});
</script>

<style scoped>
/* 样式已移至各个子组件中 */
</style>
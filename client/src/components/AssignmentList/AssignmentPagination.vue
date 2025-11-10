<template>
  <div class="pagination-section">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'AssignmentPagination',
  props: {
    initialCurrentPage: {
      type: Number,
      default: 1
    },
    initialPageSize: {
      type: Number,
      default: 10
    },
    total: {
      type: Number,
      default: 0
    }
  },
  emits: ['page-change'],
  setup(props, { emit }) {
    const currentPage = ref(props.initialCurrentPage);
    const pageSize = ref(props.initialPageSize);

    const handleSizeChange = (size) => {
      pageSize.value = size;
      emit('page-change', {
        currentPage: 1,
        pageSize: size
      });
    };

    const handleCurrentChange = (current) => {
      currentPage.value = current;
      emit('page-change', {
        currentPage: current,
        pageSize: pageSize.value
      });
    };

    return {
      currentPage,
      pageSize,
      handleSizeChange,
      handleCurrentChange
    };
  }
});
</script>

<style scoped>
.pagination-section {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  justify-content: flex-end;
}

/* 移动端响应式样式 */
@media screen and (max-width: 768px) {
  .pagination-section {
    padding: 15px;
  }
}
</style>
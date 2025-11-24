<template>
  <div class="recent-submissions">
    <h3>最近提交记录</h3>
    <el-table 
      :data="recentSubmissionsData" 
      style="width: 100%"
      stripe
    >
      <el-table-column prop="assignmentTitle" label="作业名称" align="center"></el-table-column>
      <el-table-column prop="submitTime" label="提交时间" min-width="140px" align="center">
        <template #default="scope">
          {{ formatDate(scope.row.submitTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="fileName" label="文件名" min-width="180px" align="center"></el-table-column>
      <el-table-column prop="status" label="状态" align="center">
        <template #default="scope">
          <el-tag 
            v-if="scope.row.status === 'submitted'"
            type="success"
          >
            已提交
          </el-tag>
          <el-tag 
            v-if="scope.row.status === 'late'"
            type="danger"
          >
            已逾期
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="100" fixed="right">
        <template #default="scope">
          <el-button 
            type="primary" 
            size="small" 
            @click="goToDetail(scope.row.assignmentId)"
          >
            查看
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  name: 'RecentSubmissionsSection',
  props: {
    recentSubmissionsData: {
      type: Array,
      required: true
    }
  },
  setup(props, { emit }) {
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };
    
    // 跳转到作业详情
    const goToDetail = (assignmentId) => {
      emit('go-to-detail', assignmentId);
    };
    
    return {
      formatDate,
      goToDetail
    };
  }
};
</script>

<style scoped>
.recent-submissions {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.recent-submissions h3 {
  color: #303133;
  margin-bottom: 20px;
  font-size: 18px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .recent-submissions {
    padding: 20px 15px;
    width: 100%;
  }
  
  .el-table {
    width: 100%;
    overflow-x: auto;
  }
}
</style>
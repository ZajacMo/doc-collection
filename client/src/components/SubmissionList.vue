<template>
  <div class="submission-list">
    <h3>{{ isAdmin ? '提交列表' : '我的提交记录' }}</h3>
    <el-table 
      :data="displayData" 
      style="width: 100%"
      stripe
      border
      max-height="600"
    >
      <el-table-column type="index" label="序号" min-width="60" v-if="isAdmin"></el-table-column>
      <el-table-column prop="studentId" label="学号" min-width="100" v-if="isAdmin"></el-table-column>
      <el-table-column prop="studentName" label="姓名" min-width="80" v-if="isAdmin"></el-table-column>
      <el-table-column prop="submitTime" label="提交时间" min-width="140">
        <template #default="scope">
          {{ formatDate(scope.row.submitTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="fileName" label="文件名" min-width="180"></el-table-column>
      <el-table-column prop="fileSize" label="文件大小" min-width="80">
        <template #default="scope">
          {{ formatFileSize(scope.row.fileSize) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" min-width="80">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 'submitted'" type="success">已提交</el-tag>
          <el-tag v-else-if="scope.row.status === 'late'" type="danger">已逾期</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="120" fixed="right" v-if="isAdmin">
        <template #default="scope">
          <el-button 
            v-if="scope.row.fileId"
            type="primary" 
            size="small" 
            @click="downloadFile(scope.row.fileId, scope.row.fileName)"
          >
            下载
          </el-button>
          <el-button 
            v-if="isAdmin && scope.row.id"
            type="danger" 
            size="small" 
            @click="confirmDelete(scope.row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  name: 'SubmissionList',
  props: {
    submissionList: {
      type: Array,
      required: true
    },
    userSubmission: {
      type: Object,
      default: null
    },
    isAdmin: {
      type: Boolean,
      default: false
    }
  },
  emits: ['download', 'delete'],
  computed: {
    // 根据用户角色决定显示的数据
    displayData() {
      return this.isAdmin ? this.submissionList : (this.userSubmission ? [this.userSubmission] : []);
    }
  },
  methods: {
    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    },
    
    // 格式化文件大小
    formatFileSize(bytes) {
      if (!bytes) return '-';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // 下载文件
    downloadFile(fileId, fileName) {
      this.$emit('download', fileId, fileName);
    },
    
    // 确认删除
    confirmDelete(submissionId) {
      this.$emit('delete', submissionId);
    }
  }
};
</script>

<style scoped>
.submission-list {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
}

.submission-list h3 {
  color: #303133;
  margin-bottom: 20px;
  font-size: 18px;
}

@media (max-width: 768px) {
  .submission-list {
    padding: 20px 15px;
  }
  
  .el-table {
    overflow-x: auto;
  }
}
</style>
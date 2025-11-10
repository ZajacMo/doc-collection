<template>
  <div class="submitted-status-card">
    <el-card shadow="hover">
      <div class="submitted-header">
        <div class="submitted-title">
          <h3>作业提交状态</h3>
          <el-tag 
            :type="statusType"
            size="large"
            class="status-tag"
          >
            {{ statusText }}
          </el-tag>
        </div>
        
        <!-- 使用计算属性动态渲染状态提示 -->
        <el-alert 
          v-if="alertConfig"
          :title="alertConfig.title"
          :type="alertConfig.type"
          :closable="false"
          show-icon
          style="margin-bottom: 15px;"
        ></el-alert>
      </div>
      
      <div class="submitted-details">
        <div class="detail-item">
          <span class="detail-label">提交时间：</span>
          <span class="detail-value">{{ formatDate(userSubmission.submitTime) }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">提交的文件：</span>
          <span class="detail-value">{{ userSubmission.fileName }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">文件大小：</span>
          <span class="detail-value">{{ formatFileSize(userSubmission.fileSize) }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">提交的学号：</span>
          <span class="detail-value">{{ userSubmission.studentId }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">提交的姓名：</span>
          <span class="detail-value">{{ userSubmission.studentName }}</span>
        </div>
      </div>
      
      <div class="submitted-actions" style="margin-top: 20px; text-align: right;">
        <el-button 
          type="primary" 
          size="medium"
          @click="downloadMyFile"
          icon="el-icon-download"
        >
          下载我的作业
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'SubmittedStatusCard',
  props: {
    status: {
      type: String,
      required: true,
      validator: (value) => {
        // 验证状态值是否有效
        return ['submitted', 'late', 'expired', 'urgent', 'in_progress'].includes(value);
      }
    },
  },
  computed: {
      // 根据状态获取提示配置
      alertConfig() {
        const alertMap = {
          'submitted': {
            title: '恭喜您！作业已成功提交，还可以修改。',
            type: 'success'
          },
          'expired': {
            title: '作业已提交且已过截止日期，无法修改。',
            type: 'info'
          },
          'late': {
            title: '作业已逾期提交。',
            type: 'warning'
          },
          'in_progress': {
            title: '请在截止日期前完成作业提交。',
            type: 'info'
          },
          'urgent': {
            title: '作业即将截止，请尽快提交！',
            type: 'warning'
          }
        };
        return alertMap[this.status] || null;
      },
      // 根据状态计算显示文本
      statusText() {
        const textMap = {
          'submitted': '已提交',
          'late': '已逾期',
          'expired': '已完结',
          'urgent': '紧急',
          'in_progress': '进行中'
        };
        return textMap[this.status] || '进行中';
      },
      // 根据状态计算标签类型
      statusType() {
        const typeMap = {
          'submitted': 'success',
          'late': 'danger',
          'expired': 'success',
          'urgent': 'warning',
          'in_progress': 'info'
        };
        return typeMap[this.status] || 'info';
      }
    },
  methods: {
    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    },
    
    // 格式化文件大小
    formatFileSize(bytes) {
      if (!bytes) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    

    
    // 下载我的文件
    downloadMyFile() {
      this.$emit('download');
    }
  }
};
</script>

<style scoped>
.submitted-status-card {
  margin-bottom: 20px;
}

.submitted-header {
  margin-bottom: 20px;
}

.submitted-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.submitted-title h3 {
  margin: 0;
  color: #303133;
}

.status-tag {
  margin-left: 10px;
}

.submitted-details {
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  margin-bottom: 12px;
  align-items: center;
}

.detail-label {
  width: 120px;
  color: #606266;
  font-weight: bold;
}

.detail-value {
  color: #303133;
  font-size: 15px;
}
</style>
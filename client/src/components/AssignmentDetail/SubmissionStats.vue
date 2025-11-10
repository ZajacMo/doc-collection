<template>
  <div class="submission-stats">
    <h3>提交情况统计</h3>
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ totalStudents }}</div>
          <div class="stat-label">总人数</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ submittedCount }}</div>
          <div class="stat-label">已提交</div>
          <div class="stat-percentage">{{ submittedPercentage }}%</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ pendingCount }}</div>
          <div class="stat-label">未提交</div>
          <div class="stat-percentage">{{ pendingPercentage }}%</div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'SubmissionStats',
  props: {
    totalStudents: {
      type: Number,
      required: true
    },
    submittedCount: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    // 计算未提交数量
    const pendingCount = computed(() => props.totalStudents - props.submittedCount);
    
    // 计算已提交百分比
    const submittedPercentage = computed(() => 
      props.totalStudents > 0 ? Math.round((props.submittedCount / props.totalStudents) * 100) : 0
    );
    
    // 计算未提交百分比
    const pendingPercentage = computed(() => 100 - submittedPercentage.value);
    
    return {
      pendingCount,
      submittedPercentage,
      pendingPercentage
    };
  }
};
</script>

<style scoped>
.submission-stats {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.submission-stats h3 {
  color: #303133;
  margin-bottom: 20px;
  font-size: 18px;
}

.stats-cards {
  display: flex;
  gap: 20px;
}

.stat-card {
  flex: 1;
  min-width: 200px;
}

.stat-content {
  text-align: center;
}

.stat-number {
  font-size: 36px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 16px;
  color: #606266;
  margin-bottom: 5px;
}

.stat-percentage {
  font-size: 14px;
  color: #909399;
}

@media (max-width: 768px) {
  .submission-stats {
    padding: 20px 15px;
  }
  
  .stats-cards {
    flex-direction: column;
  }
}
</style>
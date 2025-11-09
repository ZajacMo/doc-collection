<template>
  <div class="overview-section">
    <div class="overview-cards">
      <el-card class="overview-card">
        <div class="overview-content">
          <div class="overview-icon">
            <i class="el-icon-user"></i>
          </div>
          <div class="overview-info">
            <div class="overview-number">{{ totalUsers }}</div>
            <div class="overview-label">总用户数</div>
          </div>
        </div>
      </el-card>
      <el-card class="overview-card">
        <div class="overview-content">
          <div class="overview-icon">
            <i class="el-icon-document-copy"></i>
          </div>
          <div class="overview-info">
            <div class="overview-number">{{ totalAssignments }}</div>
            <div class="overview-label">总作业数</div>
          </div>
        </div>
      </el-card>
      <el-card class="overview-card">
        <div class="overview-content">
          <div class="overview-icon">
            <i class="el-icon-upload2"></i>
          </div>
          <div class="overview-info">
            <div class="overview-number">{{ totalSubmissions }}</div>
            <div class="overview-label">总提交数</div>
          </div>
        </div>
      </el-card>
      <el-card class="overview-card">
        <div class="overview-content">
          <div class="overview-icon">
            <i class="el-icon-calendar"></i>
          </div>
          <div class="overview-info">
            <div class="overview-number">{{ pendingAssignments }}</div>
            <div class="overview-label">待截止作业</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 近期活动 -->
    <div class="recent-activities">
      <h3>近期活动</h3>
      <el-table 
        :data="recentActivitiesData" 
        style="width: 100%"
        stripe
        border
        max-height="400"
      >
        <el-table-column prop="time" label="时间" min-width="120">
          <template #default="{ row }">
            {{ row && row.time ? formatDate(row.time) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="user" label="用户" min-width="100"></el-table-column>
        <el-table-column prop="action" label="操作" min-width="200"></el-table-column>
        <el-table-column prop="details" label="详情" min-width="150"></el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
/**
 * 系统概览组件
 * 展示系统的关键统计信息和近期活动
 */
export default {
  name: 'OverviewSection',
  props: {
    totalUsers: {
      type: Number,
      default: 0
    },
    totalAssignments: {
      type: Number,
      default: 0
    },
    totalSubmissions: {
      type: Number,
      default: 0
    },
    pendingAssignments: {
      type: Number,
      default: 0
    },
    recentActivitiesData: {
      type: Array,
      default: () => []
    }
  },
  setup() {
    /**
     * 格式化日期时间
     * @param {string} dateString - 日期字符串
     * @returns {string} 格式化后的日期时间字符串
     */
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    return {
      formatDate
    };
  }
};
</script>

<style scoped>
.overview-section {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.overview-card {
  text-align: center;
  height: 120px;
}

.overview-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.overview-icon {
  font-size: 48px;
  color: #1890ff;
}

.overview-info {
  text-align: left;
}

.overview-number {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.overview-label {
  font-size: 14px;
  color: #909399;
}

.recent-activities {
  margin-top: 30px;
}

.recent-activities h3 {
  color: #303133;
  margin-bottom: 20px;
  font-size: 18px;
}
</style>
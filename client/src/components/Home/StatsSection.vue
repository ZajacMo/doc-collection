<template>
  <div class="overview-section">
    <h2>作业概览</h2>
    <div class="overview-cards">
      <el-card 
        v-for="(card, index) in statsCards" 
        :key="index" 
        class="overview-card"
      >
        <div class="card-content">
          <div class="card-info">
            <div class="card-number">{{ card.value }}</div>
            <div class="card-label">{{ card.label }}</div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StatsSection',
  props: {
    statsCards: {
      type: Array,
      required: true
    }
  }
};
</script>

<style scoped>
.overview-section {
  margin-bottom: 30px;
}

.overview-section h2 {
  color: #303133;
  margin-bottom: 20px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.overview-card {
  background-color: white;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.overview-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-content {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20px;
}

.card-info {
  width: 100%;
}

.card-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.card-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .overview-cards {
    grid-template-columns: 1fr;
    gap: 15px;
  }
}
</style>
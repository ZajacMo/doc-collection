<template>
  <div class="welcome-section">
    <div class="welcome-content">
      <h1>欢迎回来！</h1>
      <p class="welcome-subtitle">
        <span class="date-icon">📅</span>
        今天是 {{ currentDate }}
      </p>
    </div>
    <div class="welcome-decoration"></div>
  </div>
</template>

<script setup>
defineProps({
  currentDate: {
    type: String,
    required: true
  }
});
</script>

<style scoped>
.welcome-section {
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
}

.welcome-content {
  position: relative;
  z-index: 1;
}

.welcome-section h1 {
  color: var(--text-primary);
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.welcome-subtitle {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.date-icon {
  font-size: 16px;
}

.welcome-decoration {
  position: absolute;
  top: -20px;
  right: -20px;
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%);
  border-radius: 50%;
  pointer-events: none;
}

@media (max-width: 768px) {
  .welcome-section h1 {
    font-size: 22px;
  }
}
</style>

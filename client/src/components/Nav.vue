<script setup>
import { House, DocumentCopy, Setting, Management } from '@element-plus/icons-vue'

// defineProps 和 defineEmits 是 Vue 3 编译器宏，不需要导入

// 定义props
const props = defineProps({
  activeMenuItem: {
    type: String,
    required: true
  },
  userInfo: {
    type: Object,
    default: null
  }
})

// 定义emits
const emit = defineEmits(['menu-select'])

// 处理菜单项选择
const handleMenuSelect = (index) => {
  emit('menu-select', index)
}
</script>

<template>
  <el-aside class="aside">
    <div class="sidebar-header">
      <span class="sidebar-label">导航</span>
    </div>
    <el-menu
      :default-active="activeMenuItem"
      class="el-menu-vertical-demo"
      @select="handleMenuSelect"
    >
      <el-menu-item index="1">
        <el-icon><House /></el-icon>
        <template #title><span>首页</span></template>
      </el-menu-item>
      <el-menu-item index="2">
        <el-icon><DocumentCopy /></el-icon>
        <template #title><span>作业</span></template>
      </el-menu-item>
      <el-menu-item index="3" v-show="userInfo?.user?.role === 'admin' || userInfo?.user?.role === 'super_admin' || userInfo?.role === 'admin' || userInfo?.role === 'super_admin'">
        <el-icon><Management /></el-icon>
        <template #title><span>管理</span></template>
      </el-menu-item>
    </el-menu>
    <div class="sidebar-footer">
      <div class="sidebar-footer-line"></div>
      <span class="sidebar-footer-text">作业收集系统 v1.0</span>
    </div>
  </el-aside>
</template>

<style scoped>
.aside {
  background: var(--gradient-sidebar);
  color: var(--text-primary);
  flex-shrink: 0;
  width: 240px;
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  @media (max-width: 968px) {
    width: 100px;
  }
  @media (max-width: 580px) {
    width: 60px;
  }
}

.sidebar-header {
  padding: 20px 24px 12px;
}

.sidebar-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
}

.el-menu-vertical-demo {
  background: transparent;
  border-right: none;
  flex: 1;
  padding: 0 12px;
}

.el-menu-vertical-demo .el-menu-item {
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  margin-bottom: 4px;
  height: 44px;
  line-height: 44px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.el-menu-vertical-demo .el-menu-item:hover {
  background-color: var(--color-primary-lighter);
  color: var(--color-primary);
}

.el-menu-vertical-demo .el-menu-item.is-active {
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 600;
}

.el-menu-vertical-demo .el-menu-item .el-icon {
  color: inherit;
}

/* 当导航栏宽度为60px时，只显示图标 */
@media (max-width: 580px) {
  .el-menu-item span {
    display: none;
  }

  .el-menu-item {
    padding: 0 10px !important;
    width: 60px;
    text-align: center;
  }

  .el-menu-item__content {
    justify-content: center;
  }

  .sidebar-header,
  .sidebar-footer {
    display: none;
  }
}

.sidebar-footer {
  padding: 16px 24px;
  margin-top: auto;
}

.sidebar-footer-line {
  height: 1px;
  background: var(--border-color);
  margin-bottom: 12px;
}

.sidebar-footer-text {
  font-size: 11px;
  color: var(--text-tertiary);
  letter-spacing: 0.02em;
}
</style>

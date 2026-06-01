<script setup>
// defineProps 和 defineEmits 是 Vue 3 编译器宏，不需要导入
import UserDropdown from './UserDropdown.vue'

// 定义props
const props = defineProps({
  userInfo: {
    type: Object,
    default: null
  }
})

// 定义emits
const emit = defineEmits(['go-to-profile', 'logout', 'change-password'])

// 处理跳转到个人中心
const handleGoToProfile = () => {
  emit('go-to-profile')
}

// 处理退出登录
const handleLogout = () => {
  emit('logout')
}

// 处理修改密码
const handleChangePassword = () => {
  emit('change-password')
}
</script>

<template>
  <el-header class="header">
    <div class="header-content">
      <div class="header-brand">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#gradient1)"/>
            <path d="M2 17L12 22L22 17" stroke="url(#gradient2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="url(#gradient2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <defs>
              <linearGradient id="gradient1" x1="2" y1="2" x2="22" y2="12" gradientUnits="userSpaceOnUse">
                <stop stop-color="#6366f1"/>
                <stop offset="1" stop-color="#8b5cf6"/>
              </linearGradient>
              <linearGradient id="gradient2" x1="2" y1="12" x2="22" y2="17" gradientUnits="userSpaceOnUse">
                <stop stop-color="#6366f1"/>
                <stop offset="1" stop-color="#8b5cf6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span class="brand-title">作业收集系统</span>
      </div>
      <div class="header-user">
        <UserDropdown
          :user-info="userInfo"
          :on-go-to-profile="handleGoToProfile"
          :on-logout="handleLogout"
          :on-change-password="handleChangePassword"
        />
      </div>
    </div>
  </el-header>
</template>

<style scoped>
.header {
  background-color: var(--bg-header);
  color: var(--text-primary);
  height: 60px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  position: relative;
  z-index: 100;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 24px;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-icon svg {
  width: 100%;
  height: 100%;
}

.brand-title {
  font-size: 18px;
  font-weight: 700;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.header-user {
  display: flex;
  align-items: center;
  cursor: pointer;
}
</style>

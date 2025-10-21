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
const emit = defineEmits(['go-to-profile', 'logout'])

// 处理跳转到个人中心
const handleGoToProfile = () => {
  emit('go-to-profile')
}

// 处理退出登录
const handleLogout = () => {
  emit('logout')
}
</script>

<template>
  <el-header class="header">
    <div class="header-content">
      <div class="header-title">
        <i class="el-icon-document"></i>
        <span>作业收集系统</span>
      </div>
      <div class="header-user">
        <UserDropdown 
          :user-info="userInfo" 
          :on-go-to-profile="handleGoToProfile" 
          :on-logout="handleLogout" 
        />
      </div>
    </div>
  </el-header>
</template>

<style scoped>
.header {
  background-color: #1890ff;
  color: white;
  height: 60px;
  flex-shrink: 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
}

.header-title {
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: bold;
}

.header-title i {
  margin-right: 10px;
}

.header-user {
  display: flex;
  align-items: center;
  cursor: pointer;
}
</style>
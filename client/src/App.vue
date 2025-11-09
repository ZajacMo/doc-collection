<script setup>
import { onMounted, ref, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCurrentUser, logoutUser } from './services/userService'
import Header from './components/Header.vue'
import Nav from './components/Nav.vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userInfo = ref(null)

// 计算当前激活的菜单项
const computedActiveMenuItem = () => {
  const path = route.path
  if (path.includes('/admin')) return '3' // 管理菜单项索引变更
  if (path.includes('/assignments')) return '2'
  if (path.includes('/profile')) return '1' // 个人中心已合并到首页
  return '1'
}

// 处理菜单项选择
const handleMenuSelect = (index) => {
  switch (index) {
    case '1':
      router.push('/home')
      break
    case '2':
      router.push('/assignments')
      break
    case '3':
      router.push('/admin') // 管理菜单项索引变更
      break
    default:
      break
  }
}

// 处理跳转到个人中心（已合并到首页）
const handleGoToProfile = () => {
  router.push('/home')
}

// 处理退出登录
const handleLogout = async () => {
  try {
    await logoutUser()
    router.push('/login')
    ElMessage.success('退出登录成功')
  } catch (error) {
    console.error('退出登录失败:', error)
    ElMessage.error('退出登录失败')
  }
}

// 更新用户信息的方法
const updateUserInfo = (newUserInfo) => {
  userInfo.value = newUserInfo;
};

onMounted(() => {
  // 只获取用户信息，路由守卫已在router/index.js中配置
  userInfo.value = getCurrentUser()
  
  // 提供用户信息和更新方法给子组件
  provide('userInfo', userInfo);
  provide('updateUserInfo', updateUserInfo);
})
</script>

<template>
  <div id="app">
    <!-- 条件渲染：只在非登录页面显示导航组件 -->
    <template v-if="!route.path.includes('/login')">
      <!-- 通用顶部导航栏 -->
      <Header 
        :user-info="userInfo" 
        @go-to-profile="handleGoToProfile"
        @logout="handleLogout"
      />

      <!-- 主内容区域 -->
      <div class="main-content">
        <!-- 通用侧边栏导航 -->
        <Nav 
          :active-menu-item="computedActiveMenuItem()"
          :user-info="userInfo"
          @menu-select="handleMenuSelect"
        />
        <!-- 内容区域 - 用于渲染子页面 -->
        <router-view />
      </div>
    </template>
    
    <!-- 登录页面特殊处理：直接显示路由内容 -->
    <template v-else>
      <div class="login-content">
        <router-view />
      </div>
    </template>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  width: 100%;
  min-height: calc(100vh - 60px); /* 考虑Header高度 */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  overflow: hidden;
}

/* 全局样式 */
body {
  margin: 0;
  font-size: 14px;
  color: #303133;
  background-color: #f5f7fa;
}

.main-content {
  display: flex;
  flex: 1;
}

/* 侧边栏样式 */
:deep(.aside) {
  width: 200px;
  flex-shrink: 0;
}

/* 内容区域样式 */
router-view {
  flex: 1;
  padding: 20px;
  min-height: calc(100vh - 60px); /* 考虑Header高度 */
}

/* 登录页面内容样式 */
.login-content {
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}


/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>

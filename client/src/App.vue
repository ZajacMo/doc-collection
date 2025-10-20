<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCurrentUser } from './services/userService'

const router = useRouter()

// 检查用户是否登录
  const checkLogin = () => {
    const user = getCurrentUser()
    const currentPath = router.currentRoute.value.path
    
    // 检查是否为公开路径
    const isPublicPath = 
      currentPath === '/' || 
      currentPath === '/login' || 
      currentPath.startsWith('/submit/')
    
    if (!user && !isPublicPath) {
      router.push('/login')
      ElMessage.warning('请先登录')
    } else if (user && (currentPath === '/' || currentPath === '/login')) {
      // 如果已登录但访问登录页，重定向到首页
      router.push('/home')
    }
  }

onMounted(() => {
  checkLogin()
  
  // 路由守卫已在router/index.js中配置，这里不再重复设置
})
</script>

<template>
  <div id="app">
    <router-view />
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
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  overflow-x: hidden;
}

/* 全局样式 */
body {
  margin: 0;
  font-size: 14px;
  color: #303133;
  background-color: #f5f7fa;
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

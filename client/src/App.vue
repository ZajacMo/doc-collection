<script setup>
import { onMounted, ref, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCurrentUser, logoutUser, changePassword, getCurrentUserInfo } from './services/userService'
import Header from './components/Header.vue'
import Nav from './components/Nav.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

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

// 修改密码
const changePasswordDialogVisible = ref(false)
const changePasswordFormRef = ref(null)
const changePasswordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const changePasswordRules = ref({
  oldPassword: [
    { required: true, message: '请输入旧密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符之间', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== changePasswordForm.value.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
})

const handleChangePassword = () => {
  changePasswordDialogVisible.value = true
}

const submitChangePassword = async () => {
  try {
    await changePasswordFormRef.value.validate()
    const currentUser = getCurrentUserInfo()
    if (!currentUser) {
      ElMessage.error('未获取到用户信息')
      return
    }
    await changePassword(
      currentUser.id,
      changePasswordForm.value.oldPassword,
      changePasswordForm.value.newPassword
    )
    ElMessage.success('密码修改成功，请重新登录')
    changePasswordDialogVisible.value = false
    // 清空表单
    changePasswordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
    // 退出登录，让用户用新密码重新登录
    setTimeout(() => {
      logoutUser()
      router.push('/login')
    }, 1500)
  } catch (error) {
    if (error.response?.status === 401) {
      ElMessage.error('旧密码错误')
    } else {
      ElMessage.error(error.response?.data?.message || '修改密码失败')
    }
  }
}

const closeChangePasswordDialog = () => {
  changePasswordDialogVisible.value = false
  changePasswordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
}

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
        @change-password="handleChangePassword"
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

    <!-- 修改密码对话框 -->
    <el-dialog
      title="修改密码"
      v-model="changePasswordDialogVisible"
      width="400px"
      :close-on-click-modal="false"
      @closed="closeChangePasswordDialog"
    >
      <el-form
        ref="changePasswordFormRef"
        :model="changePasswordForm"
        :rules="changePasswordRules"
        label-width="80px"
      >
        <el-form-item label="旧密码" prop="oldPassword">
          <el-input
            v-model="changePasswordForm.oldPassword"
            type="password"
            placeholder="请输入旧密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="changePasswordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="changePasswordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeChangePasswordDialog">取消</el-button>
          <el-button type="primary" @click="submitChangePassword">确认修改</el-button>
        </div>
      </template>
    </el-dialog>
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

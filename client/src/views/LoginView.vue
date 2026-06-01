<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="bg-circle bg-circle-1"></div>
      <div class="bg-circle bg-circle-2"></div>
      <div class="bg-circle bg-circle-3"></div>
    </div>

    <div class="login-form-wrapper">
      <!-- Logo 区域 -->
      <div class="login-brand">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#loginGradient1)"/>
            <path d="M2 17L12 22L22 17" stroke="url(#loginGradient2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="url(#loginGradient2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <defs>
              <linearGradient id="loginGradient1" x1="2" y1="2" x2="22" y2="12" gradientUnits="userSpaceOnUse">
                <stop stop-color="#6366f1"/>
                <stop offset="1" stop-color="#8b5cf6"/>
              </linearGradient>
              <linearGradient id="loginGradient2" x1="2" y1="12" x2="22" y2="17" gradientUnits="userSpaceOnUse">
                <stop stop-color="#6366f1"/>
                <stop offset="1" stop-color="#8b5cf6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h2 class="brand-title">作业收集系统</h2>
        <p class="brand-subtitle">登录您的账号</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        label-width="0"
        class="login-form"
        @submit.prevent
      >
        <el-form-item prop="studentId">
          <el-input
            v-model="loginForm.studentId"
            placeholder="请输入学号"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            @click="handleLogin"
            :loading="loading"
            class="login-button"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <p class="footer-hint">默认账号：admin / 学号</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
import { loginUser, getCurrentUser } from '../services/userService';

const loginFormRef = ref(null);
const loading = ref(false);
const loginForm = ref({
  studentId: '',
  password: ''
});
const router = useRouter();

// 注入父组件提供的updateUserInfo方法
const updateUserInfo = inject('updateUserInfo', () => {});

const loginRules = ref({
  studentId: [
    { required: true, message: '请输入学号', trigger: 'blur' },
    { min: 3, max: 20, message: '学号长度在 3 到 20 个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符之间', trigger: 'blur' }
  ]
});

const handleLogin = async () => {
  try {
    // 表单验证
    await loginFormRef.value.validate();

    loading.value = true;

    // 调用登录接口
    const result = await loginUser(loginForm.value.studentId, loginForm.value.password);

    ElMessage.success('登录成功');

    // 获取并更新用户状态
    const userInfo = await getCurrentUser();
    if (updateUserInfo) {
      updateUserInfo(userInfo);
    }

    // 根据用户角色跳转到不同页面
    if (result.user && result.user.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/home');
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '登录失败，请检查账号密码');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--bg-primary);
  position: relative;
  overflow: hidden;
  padding: 20px;
}

/* 背景装饰 */
.bg-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.4;
}

.bg-circle-1 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  top: -100px;
  right: -100px;
}

.bg-circle-2 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #06b6d4, #6366f1);
  bottom: -50px;
  left: -50px;
  opacity: 0.25;
}

.bg-circle-3 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
  top: 40%;
  left: 30%;
  opacity: 0.15;
}

.login-form-wrapper {
  background: var(--bg-card);
  padding: 48px 40px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 420px;
  position: relative;
  z-index: 1;
  border: 1px solid var(--border-color);
}

/* 品牌区域 */
.login-brand {
  text-align: center;
  margin-bottom: 32px;
}

.brand-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
}

.brand-icon svg {
  width: 100%;
  height: 100%;
}

.brand-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.brand-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

/* 表单样式 */
.login-form :deep(.el-input__wrapper) {
  border-radius: var(--radius-sm);
  padding: 4px 16px;
}

.login-form :deep(.el-input__inner) {
  height: 44px;
  font-size: 15px;
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  margin-top: 8px;
}

/* 底部提示 */
.login-footer {
  margin-top: 24px;
  text-align: center;
}

.footer-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  margin: 0;
}

/* 响应式 */
@media (max-width: 480px) {
  .login-form-wrapper {
    padding: 32px 24px;
  }

  .brand-title {
    font-size: 20px;
  }
}
</style>

<template>
  <div class="login-container">
    <div class="login-form-wrapper">
      <h2>作业收集系统 - 登录</h2>
      <el-form 
        ref="loginFormRef" 
        :model="loginForm" 
        :rules="loginRules" 
        label-width="80px"
        class="login-form"
        @submit.prevent
      >
        <el-form-item label="学号" prop="studentId">
          <el-input 
            v-model="loginForm.studentId" 
            placeholder="请输入学号"
            prefix-icon="el-icon-user" 
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码"
            prefix-icon="el-icon-lock" 
          />
        </el-form-item>
        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleLogin" 
            :loading="loading"
            style="width: 100%"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>
      <div class="login-tips">
        <p>提示：默认密码为 123456</p>
        <p>管理员账号：admin</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, inject } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { loginUser, getCurrentUser } from '../services/userService';

export default {
  name: 'LoginView',
  setup() {
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
        // console.log(result);

        ElMessage.success('登录成功');
        // console.log(result);
        
        // 获取并更新用户状态
        const userInfo = await getCurrentUser();
        if (updateUserInfo) {
          updateUserInfo(userInfo);
        }
        
        // 根据用户角色跳转到不同页面
        // 角色信息在result.user对象中
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
    
    return {
      loginFormRef,
      loginForm,
      loginRules,
      loading,
      handleLogin
    };
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f7fa;
}

.login-form-wrapper {
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 400px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .login-form-wrapper {
    padding: 30px 20px;
  }
  
  .login-form-wrapper h2 {
    font-size: 18px;
    margin-bottom: 20px;
  }
}

.login-form-wrapper h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #303133;
}

.login-form {
  margin-bottom: 20px;
}

.login-tips {
  text-align: center;
  color: #909399;
  font-size: 12px;
}

.login-tips p {
  margin: 5px 0;
}
</style>
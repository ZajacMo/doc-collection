// Vue Router配置
import { createRouter, createWebHistory } from 'vue-router';

// 导入组件
import LoginView from '../views/LoginView.vue';
import HomeView from '../views/HomeView.vue';
import AssignmentListView from '../views/AssignmentListView.vue';
import AssignmentDetailView from '../views/AssignmentDetailView.vue';
import SubmitAssignmentView from '../views/SubmitAssignmentView.vue';
import UserProfileView from '../views/UserProfileView.vue';
import AdminPanelView from '../views/AdminPanelView.vue';
import SubmissionManagementView from '../views/SubmissionManagementView.vue';

// 路由配置
const routes = [
  {
    path: '/',
    name: 'login',
    component: LoginView,
    meta: { requiresAuth: false }
  },
  {
    path: '/home',
    name: 'home',
    component: HomeView,
    meta: { requiresAuth: true }
  },
  {
    path: '/assignments',
    name: 'assignments',
    component: AssignmentListView,
    meta: { requiresAuth: true }
  },
  {
    path: '/assignments/:id',
    name: 'assignment-detail',
    component: AssignmentDetailView,
    meta: { requiresAuth: true }
  },
  {
    path: '/submit/:id',
    name: 'submit-assignment',
    component: SubmitAssignmentView,
    meta: { requiresAuth: false }
  },
  {
    path: '/profile',
    name: 'profile',
    component: UserProfileView,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'admin-dashboard',
    component: AdminPanelView,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/submissions',
    name: 'submission-management',
    component: SubmissionManagementView,
    meta: { requiresAuth: true, requiresAdmin: true }
  }
];

// 创建路由器
const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由守卫
router.beforeEach((to, from, next) => {
  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    try {
      // 安全地获取用户信息，处理可能的JSON解析错误
      const userInfoStr = localStorage.getItem('userInfo');
      const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
      const token = localStorage.getItem('token');
      
      // 同时检查userInfo和token是否存在
      if (!userInfo || !token) {
        // 未登录，重定向到登录页
        next('/');
      } else {
        // 检查是否需要管理员权限
        if (to.meta.requiresAdmin && userInfo.role !== 'admin') {
          // 不是管理员，重定向到首页
          next('/home');
        } else {
          next();
        }
      }
    } catch (error) {
      console.error('检查用户登录状态时出错:', error);
      // 出错时，视为未登录
      next('/');
    }
  } else {
    // 如果是访问登录页，而已登录，则重定向到首页
    if (to.path === '/' && localStorage.getItem('userInfo')) {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      next(userInfo.role === 'admin' ? '/admin' : '/home');
    } else {
      next();
    }
  }
});

export default router;
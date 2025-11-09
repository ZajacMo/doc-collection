// Vue Router配置
import { createRouter, createWebHistory } from 'vue-router';

// 导入组件
import LoginView from '../views/LoginView.vue';
import HomeView from '../views/HomeView.vue';
import AssignmentListView from '../views/AssignmentListView.vue';
import AssignmentDetailView from '../views/AssignmentDetailView.vue';
import SubmitAssignmentView from '../views/SubmitAssignmentView.vue';
import AdminPanelView from '../views/AdminPanelView.vue';
import SubmissionManagementView from '../views/SubmissionManagementView.vue';

// 导入用户服务
import { getCurrentUser } from '../services/userService.js';

// 路由配置
const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
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
    redirect: '/home',
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

// 全局路由守卫
router.beforeEach((to, from, next) => {
  // 获取用户信息和token
  const userInfo = getCurrentUser();
  const token = localStorage.getItem('token');

  // 需要身份验证的路由
  if (to.meta.requiresAuth) {
    if (!userInfo || !token) {
      // 未登录，重定向到登录页
      console.log('未登录，重定向到登录页');
      next('/login');
    } else {
      // 检查是否需要管理员权限
      // 兼容不同的用户信息结构
      const userRole = userInfo.user?.role || userInfo.role;
      if (to.meta.requiresAdmin && userRole !== 'admin') {
        // 不是管理员，重定向到首页
        console.log('需要管理员权限，重定向到首页');
        next('/home');
      } else {
        next();
      }
    }
  } else {
    // 如果是访问登录页，而已登录，则重定向到首页
    if (to.path === '/login' && userInfo && token) {
      console.log('已登录，重定向到相应首页');
      // 兼容不同的用户信息结构
      const userRole = userInfo.user?.role || userInfo.role;
      // 根据用户角色重定向
      next(userRole === 'admin' ? '/admin' : '/home');
    } else {
      next();
    }
  }
});

export default router;
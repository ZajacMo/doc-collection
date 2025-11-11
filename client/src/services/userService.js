// 用户服务
import api from '../utils/axios';
import { API_ENDPOINTS } from '../config/apiConfig';

// 用户登录
export const loginUser = async (studentId, password) => {
  try {
    // console.log('开始登录请求...');
    // console.log('请求参数:', { studentId, password });
    // console.log('请求URL基础地址:', api.defaults.baseURL);
    // console.log('完整请求路径:', api.defaults.baseURL + API_ENDPOINTS.USERS.LOGIN);
    const response = await api.post(API_ENDPOINTS.USERS.LOGIN, {
      studentId,
      password
    });
    
    // console.log('登录请求成功，响应数据:', response);
    
    // 后端返回的结构是 { message: '登录成功', user: {...} }
    // 保存用户信息到本地存储
    localStorage.setItem('userInfo', JSON.stringify(response));
    
    // 对于token，由于后端没有返回，我们可以使用一个简单的标识
    // 或者直接使用用户ID作为临时token
    localStorage.setItem('token', response.user.id || '');
    
    // 返回带有完整信息的响应对象，包括role在user对象中
    return response;
  } catch (error) {
    console.error('登录请求错误详情:');
    console.error('- 错误类型:', error.name);
    console.error('- 错误消息:', error.message);
    console.error('- 错误完整对象:', error);
    
    if (error.response) {
      console.error('- 响应状态:', error.response.status);
      console.error('- 响应数据:', error.response.data);
      console.error('- 响应头:', error.response.headers);
    } else if (error.request) {
      console.error('- 请求已发送但没有收到响应');
      console.error('- 请求对象:', error.request);
    } else {
      console.error('- 请求配置错误:', error.message);
    }

    
    throw error;
  }
};

// 获取所有用户
export const getAllUsers = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.USERS.ALL);
    return response;
  } catch (error) {
    console.error('获取用户列表失败:', error);
    throw error;
  }
};

// 获取单个用户
export const getUserById = async (id) => {
  try {
    const response = await api.get(API_ENDPOINTS.USERS.BY_ID(id));
    return response;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    throw error;
  }
};

// 创建用户
export const createUser = async (userData) => {
  try {
    const response = await api.post('/users', userData);
    return response;
  } catch (error) {
    console.error('创建用户失败:', error);
    throw error;
  }
};

// 更新用户
export const updateUser = async (id, userData) => {
  try {
    const response = await api.put(`/users/${id}`, userData);
    return response;
  } catch (error) {
    console.error('更新用户失败:', error);
    throw error;
  }
};

// 删除用户
export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/users/${id}`);
    return response;
  } catch (error) {
    console.error('删除用户失败:', error);
    throw error;
  }
};

// 用户登出
export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
  // 使用window.location.href跳转到登录页，确保完全清除状态
  window.location.href = '/';
};

// 获取当前登录用户信息
export const getCurrentUser = () => {
  const userInfo = localStorage.getItem('userInfo');
  if (userInfo) {
    const parsed = JSON.parse(userInfo);
    // 返回完整的用户信息对象，包括嵌套的user对象
    return parsed;
  }
  return null;
};

// 获取当前用户的用户对象（包含id、studentId、name、role等）
export const getCurrentUserInfo = () => {
  const userInfo = getCurrentUser();
  return userInfo ? userInfo.user : null;
};

// 检查用户是否已登录
export const isLoggedIn = () => {
  return !!localStorage.getItem('token');
};

// 检查用户是否为管理员
export const isAdmin = () => {
  const user = getCurrentUserInfo();
  return user ? user.role === 'admin' : false;
};

// 导入用户（从Excel文件）
export const importUsers = async (fileData) => {
  try {
    const response = await api.post('/users/import', fileData);
    return response;
  } catch (error) {
    console.error('导入用户失败:', error);
    throw error;
  }
};
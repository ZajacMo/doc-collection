// 用户服务
import api from '../utils/axios';

// 用户登录
export const loginUser = async (studentId, password) => {
  try {
    // 由于axios响应拦截器已经返回了response.data
    // 所以这里的response实际上是response.data
    const response = await api.post('/users/login', {
      studentId,
      password
    });
    // 保存用户信息和token到本地存储
    // 确保从正确的位置获取token
    localStorage.setItem('token', response.token || '');
    localStorage.setItem('userInfo', JSON.stringify(response));
    return response;
  } catch (error) {
    console.error('登录失败:', error);
    throw error;
  }
};

// 获取所有用户
export const getAllUsers = async () => {
  try {
    const response = await api.get('/users');
    return response;
  } catch (error) {
    console.error('获取用户列表失败:', error);
    throw error;
  }
};

// 获取单个用户
export const getUserById = async (id) => {
  try {
    const response = await api.get(`/users/${id}`);
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
  return userInfo ? JSON.parse(userInfo) : null;
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
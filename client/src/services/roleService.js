// 角色和权限服务
import api from '../utils/axios';

// 获取所有角色
export const getAllRoles = async () => {
  try {
    const response = await api.get('/roles');
    return response;
  } catch (error) {
    console.error('获取角色列表失败:', error);
    throw error;
  }
};

// 获取单个角色
export const getRoleById = async (id) => {
  try {
    const response = await api.get(`/roles/${id}`);
    return response;
  } catch (error) {
    console.error('获取角色信息失败:', error);
    throw error;
  }
};

// 创建角色
export const createRole = async (roleData) => {
  try {
    const response = await api.post('/roles', roleData);
    return response;
  } catch (error) {
    console.error('创建角色失败:', error);
    throw error;
  }
};

// 更新角色
export const updateRole = async (id, roleData) => {
  try {
    const response = await api.put(`/roles/${id}`, roleData);
    return response;
  } catch (error) {
    console.error('更新角色失败:', error);
    throw error;
  }
};

// 删除角色
export const deleteRole = async (id) => {
  try {
    const response = await api.delete(`/roles/${id}`);
    return response;
  } catch (error) {
    console.error('删除角色失败:', error);
    throw error;
  }
};

// 获取所有权限
export const getAllPermissions = async () => {
  try {
    const response = await api.get('/permissions');
    return response;
  } catch (error) {
    console.error('获取权限列表失败:', error);
    throw error;
  }
};

// 获取当前用户权限
export const getMyPermissions = async () => {
  try {
    const response = await api.get('/permissions/me');
    return response;
  } catch (error) {
    console.error('获取当前用户权限失败:', error);
    throw error;
  }
};

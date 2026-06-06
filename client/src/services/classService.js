// 班级服务
import api from '../utils/axios';

// 获取所有班级
export const getAllClasses = async () => {
  try {
    const response = await api.get('/classes');
    return response;
  } catch (error) {
    console.error('获取班级列表失败:', error);
    throw error;
  }
};

// 获取单个班级
export const getClassById = async (id) => {
  try {
    const response = await api.get(`/classes/${id}`);
    return response;
  } catch (error) {
    console.error('获取班级信息失败:', error);
    throw error;
  }
};

// 创建班级
export const createClass = async (classData) => {
  try {
    const response = await api.post('/classes', classData);
    return response;
  } catch (error) {
    console.error('创建班级失败:', error);
    throw error;
  }
};

// 更新班级
export const updateClass = async (id, classData) => {
  try {
    const response = await api.put(`/classes/${id}`, classData);
    return response;
  } catch (error) {
    console.error('更新班级失败:', error);
    throw error;
  }
};

// 删除班级
export const deleteClass = async (id) => {
  try {
    const response = await api.delete(`/classes/${id}`);
    return response;
  } catch (error) {
    console.error('删除班级失败:', error);
    throw error;
  }
};

// 获取班级学生列表
export const getClassStudents = async (id) => {
  try {
    const response = await api.get(`/classes/${id}/students`);
    return response;
  } catch (error) {
    console.error('获取班级学生列表失败:', error);
    throw error;
  }
};

// 设置班级学生
export const setClassStudents = async (id, studentIds) => {
  try {
    const response = await api.post(`/classes/${id}/students`, { studentIds });
    return response;
  } catch (error) {
    console.error('设置班级学生失败:', error);
    throw error;
  }
};

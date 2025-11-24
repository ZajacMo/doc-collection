// 作业服务
import api from '../utils/axios';
import { API_ENDPOINTS } from '../config/apiConfig';

// 获取所有作业
export const getAllAssignments = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.ASSIGNMENTS.ALL);
    return response;
  } catch (error) {
    console.error('获取作业列表失败:', error);
    throw error;
  }
};

// 获取单个作业
export const getAssignmentById = async (id) => {
  try {
    const response = await api.get(API_ENDPOINTS.ASSIGNMENTS.BY_ID(id));
    return response;
  } catch (error) {
    console.error('获取作业详情失败:', error);
    throw error;
  }
};

// 创建作业
export const createAssignment = async (assignmentData) => {
  try {
    const response = await api.post('/assignments', assignmentData);
    return response;
  } catch (error) {
    console.error('创建作业失败:', error);
    throw error;
  }
};

// 更新作业
export const updateAssignment = async (id, assignmentData) => {
  try {
    const response = await api.put(`/assignments/${id}`, assignmentData);
    return response;
  } catch (error) {
    console.error('更新作业失败:', error);
    throw error;
  }
};

// 删除作业
export const deleteAssignment = async (id) => {
  try {
    const response = await api.delete(`/assignments/${id}`);
    return response;
  } catch (error) {
    console.error('删除作业失败:', error);
    throw error;
  }
};

// 获取作业的提交情况
export const getAssignmentSubmissions = async (id) => {
  try {
    const response = await api.get(`/assignments/${id}/submissions`);
    return response;
  } catch (error) {
    console.error('获取作业提交情况失败:', error);
    throw error;
  }
};

// 获取作业的学生总数
export const getAssignmentUserCount = async (id) => {
  try {
    const response = await api.get(`/assignments/${id}/userCount`);
    return response;
  } catch (error) {
    console.error('获取学生总数失败:', error);
    throw error;
  }
};



// 获取作业的未提交用户
export const getMissingSubmissions = async (id) => {
  try {
    const response = await api.get(`/assignments/${id}/missing`);
    return response;
  } catch (error) {
    console.error('获取未提交用户失败:', error);
    throw error;
  }
};

// 检查作业是否已过截止日期
export const isAssignmentExpired = (deadline) => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  return now > deadlineDate;
};

// 获取作业截止日期的剩余时间
export const getTimeRemaining = (deadline) => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate - now;
  
  if (diff <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0 };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { expired: false, days, hours, minutes };
};
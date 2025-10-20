// 提交服务
import api from '../utils/axios';

// 获取所有提交
export const getAllSubmissions = async () => {
  try {
    const response = await api.get('/submissions');
    return response;
  } catch (error) {
    console.error('获取提交列表失败:', error);
    throw error;
  }
};

// 获取单个提交
export const getSubmissionById = async (id) => {
  try {
    const response = await api.get(`/submissions/${id}`);
    return response;
  } catch (error) {
    console.error('获取提详情失败:', error);
    throw error;
  }
};

// 获取用户的提交
export const getSubmissionsByUser = async (userId) => {
  try {
    const response = await api.get(`/submissions/user/${userId}`);
    return response;
  } catch (error) {
    console.error('获取用户提交记录失败:', error);
    throw error;
  }
};

// 根据作业ID获取所有提交
export const getSubmissionsByAssignment = async (assignmentId) => {
  try {
    const response = await api.get(`/submissions/assignment/${assignmentId}`);
    return response;
  } catch (error) {
    console.error('获取作业提交记录失败:', error);
    throw error;
  }
};

// 根据用户ID和作业ID获取提交（支持获取历史记录）
export const getSubmissionByUserAndAssignment = async (userId, assignmentId, includeHistory = false) => {
  try {
    let endpoint = `/submissions/user/${userId}/${assignmentId}`;
    if (includeHistory) {
      endpoint += '?includeHistory=true';
    }
    const response = await api.get(endpoint);
    return response;
  } catch (error) {
    // 如果没有找到，返回null而不是抛出错误
    if (error.response?.status === 404) {
      return null;
    }
    console.error('获取用户作业提交记录失败:', error);
    throw error;
  }
};

// 提交作业
export const submitAssignment = async (formData) => {
  try {
    const response = await api.post('/submissions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response;
  } catch (error) {
    console.error('提交作业失败:', error);
    throw error;
  }
};

// 更新提交
export const updateSubmission = async (id, submissionData) => {
  try {
    const response = await api.put(`/submissions/${id}`, submissionData);
    return response;
  } catch (error) {
    console.error('更新提交失败:', error);
    throw error;
  }
};

// 删除提交
export const deleteSubmission = async (id) => {
  try {
    const response = await api.delete(`/submissions/${id}`);
    return response;
  } catch (error) {
    console.error('删除提交失败:', error);
    throw error;
  }
};

// 下载提交的文件
export const downloadSubmission = async (id) => {
  try {
    const response = await api.get(`/submissions/${id}/download`, {
      responseType: 'blob'
    });
    return response;
  } catch (error) {
    console.error('下载文件失败:', error);
    throw error;
  }
};

// 为了向后兼容，提供downloadFile别名
export const downloadFile = downloadSubmission;

// 处理文件下载
export const handleFileDownload = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// 验证文件大小
export const validateFileSize = (file, maxSize) => {
  // maxSize 单位为MB
  const maxBytes = maxSize * 1024 * 1024;
  return file.size <= maxBytes;
};

// 验证文件类型
export const validateFileType = (file, allowedTypes) => {
  const fileExtension = file.name.split('.').pop().toLowerCase();
  return allowedTypes.includes(fileExtension);
};

// 验证文件名是否符合规则
export const validateFileName = (fileName, namingRule, userInfo, assignmentTitle) => {
  try {
    // 移除文件扩展名
    const nameWithoutExtension = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    
    // 检查是否包含必要的变量
    if (namingRule.includes('{学号}') && !nameWithoutExtension.includes(userInfo.studentId)) {
      return { isValid: false, message: '文件名必须包含学号' };
    }
    
    if (namingRule.includes('{姓名}') && !nameWithoutExtension.includes(userInfo.name)) {
      return { isValid: false, message: '文件名必须包含姓名' };
    }
    
    const cleanAssignmentTitle = assignmentTitle.replace(/[\s\/\\:*?"<>|]/g, '');
    if (namingRule.includes('{作业名称}') && !nameWithoutExtension.includes(cleanAssignmentTitle)) {
      return { isValid: false, message: '文件名必须包含作业名称' };
    }
    
    // 检查是否包含非法字符
    const illegalChars = /[\\/:*?"<>|]/;
    if (illegalChars.test(nameWithoutExtension)) {
      return { isValid: false, message: '文件名不能包含特殊字符：\\/:*?"<>|' };
    }
    
    return { isValid: true };
  } catch (error) {
    console.error('验证文件名失败:', error);
    return { isValid: false, message: '文件名验证失败' };
  }
};
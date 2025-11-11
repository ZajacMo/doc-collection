// 提交服务
import api from '../utils/axios';
import { API_ENDPOINTS } from '../config/apiConfig';

// 获取所有提交
export const getAllSubmissions = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.SUBMISSIONS.ALL);
    return response;
  } catch (error) {
    console.error('获取提交列表失败:', error);
    throw error;
  }
};

// 获取单个提交
export const getSubmissionById = async (id) => {
  try {
    const response = await api.get(API_ENDPOINTS.SUBMISSIONS.DETAIL(id));
    return response;
  } catch (error) {
    console.error('获取提详情失败:', error);
    throw error;
  }
};

// 获取用户的提交
export const getSubmissionsByUser = async (userId) => {
  try {
    const response = await api.get(API_ENDPOINTS.SUBMISSIONS.BY_USER(userId));
    return response;
  } catch (error) {
    console.error('获取用户提交记录失败:', error);
    throw error;
  }
};

// 根据作业ID获取所有提交
export const getSubmissionsByAssignment = async (assignmentId) => {
  try {
    // 服务器端实际的端点是/assignments/:id/submissions
    const response = await api.get(API_ENDPOINTS.ASSIGNMENTS.SUBMISSIONS(assignmentId));
    return response;
  } catch (error) {
    console.error('获取作业提交记录失败:', error);
    throw error;
  }
};

// 根据用户ID和作业ID获取提交（支持获取历史记录）
// export const getSubmissionByUserAndAssignment = async (userId, assignmentId, includeHistory = false) => {
//   try {
//     // 服务器端只有获取用户所有提交的端点，所以我们先获取所有提交，然后在客户端过滤
//     const endpoint = `/submissions/user/${userId}`;
//     const response = await api.get(endpoint);
    
//     // 在客户端根据作业ID过滤提交
//     if (Array.isArray(response)) {
//       const filteredSubmissions = response.filter(submission => 
//         submission.assignmentId === assignmentId
//       );
      
//       // 如果只需要最新的提交，返回第一个匹配的
//       if (!includeHistory && filteredSubmissions.length > 0) {
//         return filteredSubmissions[0];
//       }
      
//       // 返回所有匹配的提交（历史记录）
//       return filteredSubmissions.length > 0 ? filteredSubmissions : null;
//     }
    
//     // 处理响应不是数组的情况
//     return null;
//   } catch (error) {
//     // 如果没有找到，返回null而不是抛出错误
//     if (error.response?.status === 404) {
//       return null;
//     }
//     console.error('获取用户作业提交记录失败:', error);
//     throw error;
//   }
// };

// 提交作业
export const submitAssignment = async (formData) => {
  try {
    console.log('提交作业请求数据:', formData);
    
    // 确保formData包含所有必要字段
    const submissionData = {
      assignmentId: formData.assignmentId,
      studentId: formData.studentId,
      studentName: formData.studentName,
      assignmentName: formData.assignmentName,
      fileName: formData.fileName,
      filePath: formData.filePath,
      fileSize: formData.fileSize,
      fileId: formData.fileId
    };
    
    console.log('处理后的提交数据:', submissionData);
    
    // 直接发送处理后的submissionData对象
    const response = await api.post(API_ENDPOINTS.SUBMISSIONS.CREATE, submissionData);
    
    console.log('提交作业响应:', response);
    return response.data;
  } catch (error) {
    console.error('提交作业API错误详情:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });
    throw error;
  }
};

// 更新提交
export const updateSubmission = async (id, submissionData) => {
  try {
    const response = await api.put(API_ENDPOINTS.SUBMISSIONS.UPDATE(id), submissionData);
    return response;
  } catch (error) {
    console.error('更新提交失败:', error);
    throw error;
  }
};

// 删除提交
export const deleteSubmission = async (id) => {
  try {
    const response = await api.delete(API_ENDPOINTS.SUBMISSIONS.DELETE(id));
    return response;
  } catch (error) {
    console.error('删除提交失败:', error);
    throw error;
  }
};

// 下载提交的文件
export const downloadSubmission = async (id) => {
  try {
    const response = await api.get(API_ENDPOINTS.SUBMISSIONS.DOWNLOAD(id), {
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

// 获取学生的作业提交状态
export const getStudentSubmission = async (studentId, assignmentId) => {
  try {
    const response = await api.get(API_ENDPOINTS.SUBMISSIONS.STATUS(studentId, assignmentId));
    return response;
  } catch (error) {
    console.error('获取学生提交状态失败:', error);
    throw error;
  }
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

export const exportUnsubmittedListAPI = async (assignmentId) => {
  try {
    const response = await api.get(API_ENDPOINTS.SUBMISSIONS.EXPORT_UNSUBMITTED(assignmentId));
    return response;
  } catch (error) {
    console.error('导出未交名单失败:', error);
    throw error;
  }
};
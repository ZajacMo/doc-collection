// API配置文件
// 集中管理所有API相关的配置信息

// 后端API基础URL
// 在生产环境中，由于使用了Nginx代理，可以直接使用相对路径'/api'
// 在开发环境中，需要使用完整的localhost地址
const API_BASE_URL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api';

// 文件上传URL
const UPLOAD_URL = `${API_BASE_URL}/upload`;

// API端点配置
const API_ENDPOINTS = {
  // 用户相关
  USERS: {
    LOGIN: '/users/login',
    ALL: '/users',
    BY_ID: (id) => `/users/${id}`,
    IMPORT: '/users/import'
  },
  // 作业相关
  ASSIGNMENTS: {
    ALL: '/assignments',
    BY_ID: (id) => `/assignments/${id}`,
    SUBMISSIONS: (assignmentId) => `/assignments/${assignmentId}/submissions`,
    CREATE: '/assignments',
    UPDATE: (id) => `/assignments/${id}`,
    DELETE: (id) => `/assignments/${id}`
  },
  // 提交相关
  SUBMISSIONS: {
    ALL: '/submissions',
    DETAIL: (id) => `/submissions/${id}`,
    BY_USER: (userId) => `/submissions/user/${userId}`,
    CREATE: '/submissions',
    UPDATE: (id) => `/submissions/${id}`,
    DELETE: (id) => `/submissions/${id}`,
    DOWNLOAD: (id) => `/submissions/${id}/download`,
    STATUS: (studentId, assignmentId) => `/submissions/status/${studentId}/${assignmentId}`,
    EXPORT_UNSUBMITTED: (assignmentId) => `/submissions/export-unsubmitted/${assignmentId}`,
    UPLOAD: '/upload'
  },
  // 系统相关
  SYSTEM: {
    HEALTH: '/health'
  }
};

export {
  API_BASE_URL,
  UPLOAD_URL,
  API_ENDPOINTS
};
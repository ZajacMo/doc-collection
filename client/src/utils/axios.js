// Axios配置
import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// console.log('Axios实例已创建');
// console.log('基础URL:', api.defaults.baseURL);

// 请求拦截器
api.interceptors.request.use(
  config => {
    // console.log('=== 请求拦截器 ===');
    // console.log('请求URL:', config.url);
    // console.log('请求方法:', config.method);
    // console.log('完整URL:', config.baseURL + config.url);
    // console.log('请求头:', config.headers);
    // console.log('请求数据:', config.data);
    
    // 在发送请求之前做些什么
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    // 处理请求错误
    console.error('请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  response => {
    // console.log('=== 响应拦截器 - 成功 ===');
    // console.log('请求URL:', response.config?.url);
    // console.log('响应状态:', response.status);
    // console.log('响应头:', response.headers);
    // console.log('响应数据:', response.data);
    
    // 对于blob类型的响应，返回完整的response对象
    if (response.config && response.config.responseType === 'blob') {
      return response;
    }
    return response.data;
  },
  error => {
    console.log('=== 响应拦截器 - 错误 ===');
    console.log('错误URL:', error.config?.url);
    console.log('完整错误:', error);
    
    // 处理响应错误
    if (error.response) {
      console.error('响应错误 - 状态码:', error.response.status);
      console.error('响应错误 - 数据:', error.response.data);
      console.error('响应错误 - 头信息:', error.response.headers);
      
      // 服务器返回错误状态码
      switch (error.response.status) {
        case 401:
          // 未授权，清除token并跳转到登录页
          localStorage.removeItem('token');
          localStorage.removeItem('userInfo');
          window.location.href = '/';
          break;
        case 403:
          // 禁止访问
          console.error('无权限访问');
          break;
        case 404:
          // 资源不存在
          console.error('请求的资源不存在 - 详细信息:', error.response.data);
          break;
        case 500:
          // 服务器错误
          console.error('服务器发生错误 - 详细信息:', error.response.data);
          break;
        default:
          console.error('请求失败 - 状态码:', error.response.status);
      }
    } else if (error.request) {
      // 请求发出但没有收到响应
      console.error('网络错误 - 请求已发送但未收到响应');
      console.error('请求详情:', error.request);
    } else {
      // 请求配置出错
      console.error('请求配置错误:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
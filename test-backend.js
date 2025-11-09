// 测试后端服务连接
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/health',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('正在测试后端服务连接...');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('HTTP状态码:', res.statusCode);
    console.log('响应数据:', data);
    
    if (res.statusCode === 200) {
      console.log('✅ 后端服务正常运行！');
    } else {
      console.log('❌ 后端服务返回错误状态码');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ 无法连接到后端服务:', error.message);
  console.error('请确保后端服务正在运行，端口为3001');
});

req.end();
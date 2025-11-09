// 详细调试登录API
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/users/login', // 完整路径
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(JSON.stringify({
      studentId: 'admin',
      password: 'admin'
    }))
  }
};

console.log('正在调试登录API...');
console.log('请求路径:', options.path);
console.log('请求方法:', options.method);
console.log('请求端口:', options.port);

const req = http.request(options, (res) => {
  console.log('\n响应状态码:', res.statusCode);
  console.log('响应头:', JSON.stringify(res.headers, null, 2));
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('响应体:', data);
    
    try {
      const jsonData = JSON.parse(data);
      console.log('解析后的响应:', JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log('响应不是有效的JSON');
    }
  });
});

req.on('error', (error) => {
  console.error('\n请求失败:', error.message);
  console.error('错误类型:', error.code);
});

// 发送请求体
req.write(JSON.stringify({
  studentId: 'admin',
  password: 'admin'
}));
req.end();
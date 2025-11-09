// 测试登录API的脚本
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/users/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(JSON.stringify({
      studentId: 'admin',
      password: 'admin'
    }))
  }
};

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (error) => {
  console.error(error);
});

// 写入请求体
req.write(JSON.stringify({
  studentId: 'admin',
  password: 'admin'
}));
req.end();
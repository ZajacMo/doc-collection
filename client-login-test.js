// 模拟前端登录流程的测试脚本 - 使用Node.js内置模块
const http = require('http');

// 测试登录函数
const testLogin = (studentId, password) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      studentId,
      password
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/users/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          // 解析JSON响应
          const result = JSON.parse(responseData);
          // console.log(`登录用户: ${studentId}, 状态码: ${res.statusCode}`);
          // console.log('返回数据:', result);
          
          // 模拟前端代码的处理逻辑
          if (res.statusCode === 200) {
            // 模拟响应拦截器返回response.data
            // console.log('模拟响应拦截器处理后的数据:', result);
            // console.log('token:', result.token);
            // console.log('用户信息:', result);
            resolve(result);
          } else {
            reject(new Error(`登录失败: ${result.message}`));
          }
        } catch (error) {
          reject(new Error('响应数据解析错误'));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`请求错误: ${error.message}`));
    });

    // 写入请求体
    req.write(data);
    req.end();
  });
};

// 运行测试
(async () => {
  try {
    console.log('=== 开始测试登录流程 ===');
    // 测试admin用户登录
    console.log('\n测试1: admin用户登录');
    await testLogin('admin', '123456');
    
    // 测试普通用户登录
    console.log('\n测试2: 普通用户登录');
    await testLogin('2023001', '123456');
    
    // 测试不存在的用户
    console.log('\n测试3: 不存在的用户登录');
    try {
      await testLogin('nonexistent', '123456');
    } catch (error) {
      console.log('预期的错误:', error.message);
    }
    
    console.log('\n=== 所有测试完成 ===');
  } catch (error) {
    console.error('测试失败:', error.message);
  }
})();
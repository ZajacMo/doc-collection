// 测试：作业文件类型限制前后端一致性
const http = require('http');

const BASE = { hostname: 'localhost', port: 3001, headers: { 'Content-Type': 'application/json' } };

function request(path, method, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({ ...BASE, path, method }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json;
        try { json = JSON.parse(data || '{}'); } catch { json = { raw: data }; }
        resolve({ status: res.statusCode, data: json });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('== 创建作业，限定仅 pdf ==');
  const createRes = await request('/api/assignments', 'POST', {
    title: 'TypeLimitTest',
    description: '仅允许pdf类型',
    deadline: new Date(Date.now() + 24*60*60*1000).toISOString(),
    fileTypes: ['pdf']
  });
  console.log('创建作业响应:', createRes.status, createRes.data);
  if (createRes.status !== 201) {
    console.error('创建作业失败，终止测试');
    return;
  }
  const assignmentId = createRes.data.id;

  console.log('\n== 尝试提交不被允许的 doc 类型 ==');
  const denyRes = await request('/api/submissions', 'POST', {
    assignmentId,
    studentId: '2023001',
    studentName: '张三',
    assignmentName: 'TypeLimitTest',
    fileName: 'report.doc',
    filePath: 'uploads/TypeLimitTest/report.doc',
    fileSize: 1234
  });
  console.log('不允许类型提交响应:', denyRes.status, denyRes.data);

  console.log('\n== 尝试提交允许的 pdf 类型 ==');
  const allowRes = await request('/api/submissions', 'POST', {
    assignmentId,
    studentId: '2023001',
    studentName: '张三',
    assignmentName: 'TypeLimitTest',
    fileName: 'report.pdf',
    filePath: 'uploads/TypeLimitTest/report.pdf',
    fileSize: 1234
  });
  console.log('允许类型提交响应:', allowRes.status, allowRes.data);
}

run().catch((e) => { console.error('测试出错:', e); });


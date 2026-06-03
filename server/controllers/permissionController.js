// 权限控制器
const { getDb } = require('../db/db');

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('查询数据库失败:', err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// 获取所有权限（按模块分组）
exports.getAllPermissions = async (req, res) => {
  try {
    const permissions = await query(
      'SELECT id, code, name, description, module FROM permissions ORDER BY module, code'
    );

    // 按模块分组
    const grouped = {};
    permissions.forEach(p => {
      if (!grouped[p.module]) {
        grouped[p.module] = [];
      }
      grouped[p.module].push(p);
    });

    res.json(grouped);
  } catch (error) {
    res.status(500).json({ message: '获取权限列表失败', error: error.message });
  }
};

// 获取当前用户权限
exports.getMyPermissions = async (req, res) => {
  try {
    const { getRolePermissions } = require('../db/db');
    const permissions = await getRolePermissions(req.user.role);
    res.json({ role: req.user.role, permissions });
  } catch (error) {
    res.status(500).json({ message: '获取权限失败', error: error.message });
  }
};

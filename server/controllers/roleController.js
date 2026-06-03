// 角色控制器
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

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.run(sql, params, function(err) {
      if (err) {
        console.error('执行SQL失败:', err.message);
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

const getOne = async (sql, params = []) => {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
};

// 获取所有角色（含权限）
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await query('SELECT id, code, name, description, is_system FROM roles ORDER BY code');

    // 为每个角色加载权限
    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        const permissions = await query(
          `SELECT p.id, p.code, p.name, p.description, p.module
           FROM permissions p
           JOIN role_permissions rp ON p.id = rp.permission_id
           WHERE rp.role_id = ?
           ORDER BY p.module, p.code`,
          [role.id]
        );
        return { ...role, permissions };
      })
    );

    res.json(rolesWithPermissions);
  } catch (error) {
    res.status(500).json({ message: '获取角色列表失败', error: error.message });
  }
};

// 获取单个角色
exports.getRoleById = async (req, res) => {
  try {
    const role = await getOne('SELECT id, code, name, description, is_system FROM roles WHERE id = ?', [req.params.id]);
    if (!role) {
      return res.status(404).json({ message: '角色不存在' });
    }

    const permissions = await query(
      `SELECT p.id, p.code, p.name, p.description, p.module
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = ?
       ORDER BY p.module, p.code`,
      [role.id]
    );

    res.json({ ...role, permissions });
  } catch (error) {
    res.status(500).json({ message: '获取角色信息失败', error: error.message });
  }
};

// 创建角色
exports.createRole = async (req, res) => {
  try {
    const { code, name, description, permissionIds = [] } = req.body;

    if (!code || !name) {
      return res.status(400).json({ message: '角色代码和名称不能为空' });
    }

    // 检查 code 是否已存在
    const existing = await getOne('SELECT id FROM roles WHERE code = ?', [code]);
    if (existing) {
      return res.status(400).json({ message: '角色代码已存在' });
    }

    const id = `role_${code}`;

    await run(
      'INSERT INTO roles (id, code, name, description, is_system) VALUES (?, ?, ?, ?, ?)',
      [id, code, name, description || '', 0]
    );

    // 分配权限
    if (permissionIds.length > 0) {
      const stmt = getDb().prepare('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)');
      permissionIds.forEach(pid => stmt.run(id, pid));
      stmt.finalize();
    }

    const newRole = await getOne('SELECT id, code, name, description, is_system FROM roles WHERE id = ?', [id]);
    res.status(201).json(newRole);
  } catch (error) {
    res.status(500).json({ message: '创建角色失败', error: error.message });
  }
};

// 更新角色
exports.updateRole = async (req, res) => {
  try {
    const { name, description, permissionIds } = req.body;
    const roleId = req.params.id;

    const role = await getOne('SELECT * FROM roles WHERE id = ?', [roleId]);
    if (!role) {
      return res.status(404).json({ message: '角色不存在' });
    }

    // 系统内置角色不允许修改 code
    if (role.is_system) {
      // 只允许修改名称、描述和权限
      const updates = [];
      const params = [];
      if (name !== undefined) {
        updates.push('name = ?');
        params.push(name);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        params.push(description);
      }
      if (updates.length > 0) {
        params.push(roleId);
        await run(`UPDATE roles SET ${updates.join(', ')} WHERE id = ?`, params);
      }
    } else {
      const updates = [];
      const params = [];
      if (name !== undefined) {
        updates.push('name = ?');
        params.push(name);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        params.push(description);
      }
      if (updates.length > 0) {
        params.push(roleId);
        await run(`UPDATE roles SET ${updates.join(', ')} WHERE id = ?`, params);
      }
    }

    // 更新权限关联
    if (permissionIds !== undefined) {
      // 先删除原有权限
      await run('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
      // 再插入新权限
      if (permissionIds.length > 0) {
        const db = getDb();
        const stmt = db.prepare('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)');
        permissionIds.forEach(pid => stmt.run(roleId, pid));
        stmt.finalize();
      }
    }

    const updatedRole = await getOne('SELECT id, code, name, description, is_system FROM roles WHERE id = ?', [roleId]);
    const permissions = await query(
      `SELECT p.id, p.code, p.name, p.description, p.module
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = ?`,
      [roleId]
    );

    res.json({ ...updatedRole, permissions });
  } catch (error) {
    res.status(500).json({ message: '更新角色失败', error: error.message });
  }
};

// 删除角色
exports.deleteRole = async (req, res) => {
  try {
    const role = await getOne('SELECT * FROM roles WHERE id = ?', [req.params.id]);
    if (!role) {
      return res.status(404).json({ message: '角色不存在' });
    }

    if (role.is_system) {
      return res.status(403).json({ message: '系统内置角色不可删除' });
    }

    // 检查是否有用户使用该角色
    const usersWithRole = await getOne('SELECT COUNT(*) as count FROM users WHERE role = ?', [role.code]);
    if (usersWithRole && usersWithRole.count > 0) {
      return res.status(400).json({ message: '该角色下仍有用户，无法删除' });
    }

    await run('DELETE FROM role_permissions WHERE role_id = ?', [req.params.id]);
    await run('DELETE FROM roles WHERE id = ?', [req.params.id]);

    res.json({ message: '角色删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除角色失败', error: error.message });
  }
};

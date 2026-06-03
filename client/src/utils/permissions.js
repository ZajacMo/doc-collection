// 权限工具函数

/**
 * 获取当前用户的权限列表
 * @returns {string[]} 权限 code 数组
 */
export const getUserPermissions = () => {
  const userInfo = localStorage.getItem('userInfo');
  if (!userInfo) return [];
  try {
    const parsed = JSON.parse(userInfo);
    const user = parsed.user || parsed;
    return user.permissions || [];
  } catch {
    return [];
  }
};

/**
 * 获取当前用户角色
 * @returns {string|null} 角色 code
 */
export const getUserRole = () => {
  const userInfo = localStorage.getItem('userInfo');
  if (!userInfo) return null;
  try {
    const parsed = JSON.parse(userInfo);
    const user = parsed.user || parsed;
    return user.role || null;
  } catch {
    return null;
  }
};

/**
 * 检查当前用户是否拥有指定权限
 * @param {string|string[]} permission - 单个权限 code 或权限数组
 * @returns {boolean}
 */
export const hasPermission = (permission) => {
  const role = getUserRole();
  // super_admin 拥有所有权限
  if (role === 'super_admin') return true;

  const permissions = getUserPermissions();
  if (Array.isArray(permission)) {
    return permission.some(p => permissions.includes(p));
  }
  return permissions.includes(permission);
};

/**
 * 检查当前用户是否为管理员（admin 或 super_admin）
 * @returns {boolean}
 */
export const isAdmin = () => {
  const role = getUserRole();
  return role === 'admin' || role === 'super_admin';
};

/**
 * 检查当前用户是否为超级管理员
 * @returns {boolean}
 */
export const isSuperAdmin = () => {
  return getUserRole() === 'super_admin';
};

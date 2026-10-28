export const getRoleType = (user) => {
  if (!user) return 'guest';
  if (user.isSuperAdmin || (user.role || '').toLowerCase().includes('super')) {
    return 'superadmin';
  }
  const roleName = (user.role || '').toLowerCase();
  if (roleName.includes('admin') || roleName.includes('owner')) {
    return 'owner';
  }
  if (roleName.includes('manager')) {
    return 'manager';
  }
  if (roleName.includes('sales')) {
    return 'sales';
  }
  return 'sales';
};

export const getDefaultRouteForRole = (user) => {
  const roleType = getRoleType(user);
  switch (roleType) {
    case 'superadmin':
      return '/platform';
    case 'owner':
      return '/owner';
    case 'manager':
      return '/manager';
    case 'sales':
      return '/sales';
    default:
      return '/login';
  }
};

export const isRouteAuthorizedForRole = (roleType, path) => {
  const normalizedPath = (path || '').split('?')[0];

  switch (roleType) {
    case 'superadmin':
      return normalizedPath === '/platform';
    case 'owner':
      return [
        '/owner',
        '/manager',
        '/sales',
        '/quotations',
        '/products',
        '/customers',
        '/quotations/new',
        '/team',
        '/settings'
      ].includes(normalizedPath);
    case 'manager':
      return [
        '/manager',
        '/quotations',
        '/products',
        '/customers',
        '/quotations/new'
      ].includes(normalizedPath);
    case 'sales':
      return [
        '/sales',
        '/quotations',
        '/products',
        '/customers',
        '/quotations/new'
      ].includes(normalizedPath);
    default:
      return false;
  }
};

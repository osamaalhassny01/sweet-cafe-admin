export type AdminRole = 'ADMIN' | 'ORDERS_STAFF' | 'PRODUCTS_STAFF';

export const ROLE_LABELS: Record<AdminRole, string> = {
  ADMIN: 'مدير',
  ORDERS_STAFF: 'موظف طلبات',
  PRODUCTS_STAFF: 'موظف منتجات',
};

export function hasAccess(role: string | null | undefined, allowedRoles?: AdminRole[]) {
  if (!allowedRoles?.length) return true;
  if (!role) return true;
  if (role === 'ADMIN') return true;
  return allowedRoles.includes(role as AdminRole);
}

export function isAdmin(role: string | null | undefined) {
  return !role || role === 'ADMIN';
}

import { Role } from '@prisma/client';

export type Permission =
  | 'CREATE_TRANSACTION_ALL'
  | 'CREATE_TRANSACTION_SALE'
  | 'VIEW_TRANSACTION_ALL'
  | 'VIEW_TRANSACTION_OWN'
  | 'EDIT_TRANSACTION_CORRECTION'
  | 'APPROVE_CORRECTION'
  | 'VOID_TRANSACTION'
  | 'VIEW_REPORTS'
  | 'EXPORT_REPORTS'
  | 'MANAGE_COA'
  | 'MANAGE_PARTY'
  | 'VIEW_DASHBOARD_FULL'
  | 'VIEW_DASHBOARD_LIMITED'
  | 'MANAGE_USERS'
  | 'MANAGE_FY'
  | 'VIEW_AUDIT_LOGS'
  | 'SYSTEM_SETTINGS';

const RBAC_RULES: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    'CREATE_TRANSACTION_ALL',
    'VIEW_TRANSACTION_ALL',
    'EDIT_TRANSACTION_CORRECTION',
    'APPROVE_CORRECTION',
    'VOID_TRANSACTION',
    'VIEW_REPORTS',
    'EXPORT_REPORTS',
    'MANAGE_COA',
    'MANAGE_PARTY',
    'VIEW_DASHBOARD_FULL',
    'MANAGE_USERS',
    'MANAGE_FY',
    'VIEW_AUDIT_LOGS',
    'SYSTEM_SETTINGS',
  ],
  [Role.ACCOUNTANT]: [
    'CREATE_TRANSACTION_ALL',
    'VIEW_TRANSACTION_ALL',
    'EDIT_TRANSACTION_CORRECTION',
    'VIEW_REPORTS',
    'EXPORT_REPORTS',
    'MANAGE_PARTY',
    'VIEW_DASHBOARD_FULL',
  ],
  [Role.MAINTAINER]: [
    'CREATE_TRANSACTION_ALL',
    'VIEW_TRANSACTION_ALL',
    'EDIT_TRANSACTION_CORRECTION',
    'VIEW_REPORTS',
    'EXPORT_REPORTS',
    'MANAGE_PARTY',
    'VIEW_DASHBOARD_FULL',
  ],
  [Role.EMPLOYEE]: [
    'CREATE_TRANSACTION_SALE',
    'VIEW_TRANSACTION_OWN',
    'VIEW_DASHBOARD_LIMITED',
  ],
  [Role.READ_ONLY]: [
    'VIEW_TRANSACTION_ALL',
    'VIEW_REPORTS',
    'VIEW_DASHBOARD_LIMITED',
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = RBAC_RULES[role];
  if (!permissions) return false;
  
  // Allow CREATE_TRANSACTION_ALL to satisfy CREATE_TRANSACTION_SALE
  if (permission === 'CREATE_TRANSACTION_SALE' && permissions.includes('CREATE_TRANSACTION_ALL')) {
    return true;
  }
  // Allow VIEW_TRANSACTION_ALL to satisfy VIEW_TRANSACTION_OWN
  if (permission === 'VIEW_TRANSACTION_OWN' && permissions.includes('VIEW_TRANSACTION_ALL')) {
    return true;
  }
  // Allow VIEW_DASHBOARD_FULL to satisfy VIEW_DASHBOARD_LIMITED
  if (permission === 'VIEW_DASHBOARD_LIMITED' && permissions.includes('VIEW_DASHBOARD_FULL')) {
    return true;
  }

  return permissions.includes(permission);
}

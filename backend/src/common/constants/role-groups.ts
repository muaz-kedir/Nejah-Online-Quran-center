import { UserRole } from '../enums/user-role.enum';

/** Roles with full academic module access */
export const ACADEMIC_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.QIRAT_MANAGER,
] as const;

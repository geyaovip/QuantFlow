export class AdminPermissionDeniedError extends Error {
  constructor(permission: string) {
    super(`缺少管理权限：${permission}`);
    this.name = "AdminPermissionDeniedError";
  }
}

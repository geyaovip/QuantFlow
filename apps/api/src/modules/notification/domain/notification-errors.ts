export class NotificationNotFoundError extends Error {
  constructor() {
    super("通知不存在");
    this.name = "NotificationNotFoundError";
  }
}

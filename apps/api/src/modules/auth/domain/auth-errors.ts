export class AuthUnavailableError extends Error {
  constructor(message = "认证服务暂时不可用，请稍后再试") {
    super(message);
  }
}

export class InvalidOtpError extends Error {
  constructor(message = "验证码无效或已过期") {
    super(message);
  }
}

export class AuthAccessDeniedError extends Error {
  constructor(message = "当前账号无法登录该入口") {
    super(message);
  }
}

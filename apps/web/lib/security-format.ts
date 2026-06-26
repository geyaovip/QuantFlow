export function formatSecurityEvent(eventType: string) {
  const labels: Record<string, string> = {
    auth_otp_requested: "请求验证码",
    auth_otp_sent: "验证码已发送",
    auth_otp_send_failed: "验证码发送失败",
    auth_otp_verified: "验证码验证成功",
    auth_otp_failed: "验证码验证失败",
    auth_session_created: "创建登录会话",
    auth_logout: "退出登录",
  };

  return labels[eventType] ?? eventType;
}

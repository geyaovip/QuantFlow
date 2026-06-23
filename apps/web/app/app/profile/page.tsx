import { PageHeader } from "@quantflow/ui";

export default function ProfilePage() {
  return (
    <div>
      <PageHeader
        eyebrow="个人中心"
        title="我的 QuantFlow"
        description="登录、会员权益和安全记录将在认证切片接入。"
      />
      <div className="empty-state">
        <strong>尚未登录</strong>
        <p>用户端统一使用 Resend 邮箱验证码登录，不设置密码。</p>
      </div>
    </div>
  );
}

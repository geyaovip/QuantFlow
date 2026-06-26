import { PageHeader } from "@quantflow/ui";

export default function ProfilePage() {
  return (
    <div>
      <PageHeader
        eyebrow="个人中心"
        title="我的 QuantFlow"
        description="查看邮箱登录状态、访问权益、通知偏好和安全记录。用户端与管理端统一使用邮箱验证码登录。"
      />
      <div className="empty-state">
        <strong>请先完成邮箱验证</strong>
        <p>登录后可查看访问权益、模拟盘容量、最近安全事件和通知设置。</p>
      </div>
    </div>
  );
}

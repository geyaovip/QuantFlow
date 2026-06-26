import { PageHeader } from "@quantflow/ui";

export default function UsersPage() {
  return (
    <>
      <PageHeader
        eyebrow="用户与会员"
        title="用户管理"
        description="查看用户登录邮箱、访问权益、模拟盘容量和安全状态。列表默认每页 50 条。"
      />
      <div className="admin-empty">
        <strong>暂无用户记录</strong>
        <span>用户完成邮箱验证后会出现在这里，敏感变更会写入审计日志。</span>
      </div>
    </>
  );
}

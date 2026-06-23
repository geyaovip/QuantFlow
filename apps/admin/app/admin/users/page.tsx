import { PageHeader } from "@quantflow/ui";

export default function UsersPage() {
  return (
    <>
      <PageHeader
        eyebrow="用户与会员"
        title="用户管理"
        description="用户列表默认每页 50 条；认证、筛选、RBAC 与审计将在后续切片接入。"
      />
      <div className="admin-empty">用户数据尚未接入</div>
    </>
  );
}

import { PageHeader } from "@quantflow/ui";

import { AdminUsersConsole } from "../../../components/admin-users-console";
import { getAdminUsers } from "../../../lib/governance-api";
import { resolveApiBaseUrl } from "../../../lib/strategy-api";

export default async function UsersPage() {
  const users = await getAdminUsers().catch(() => ({
    data: [],
    pagination: { page: 1, pageSize: 50, total: 0, totalPages: 1 },
  }));

  return (
    <>
      <PageHeader
        eyebrow="用户与会员"
        title="用户管理"
        description="查看用户登录邮箱、访问权益、模拟盘容量和安全状态。列表默认每页 50 条。"
      />
      {users.data.length ? (
        <AdminUsersConsole
          apiBaseUrl={resolveApiBaseUrl()}
          users={users.data}
        />
      ) : (
        <div className="admin-empty">
          <strong>暂无用户记录</strong>
          <span>用户完成邮箱验证后会出现在这里，敏感变更会写入审计日志。</span>
        </div>
      )}
    </>
  );
}

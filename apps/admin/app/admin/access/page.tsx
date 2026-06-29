import { PageHeader } from "@quantflow/ui";

import { AdminAccessConsole } from "../../../components/admin-access-console";
import { getAdminAccounts, getAdminRoles } from "../../../lib/governance-api";
import { resolveApiBaseUrl } from "../../../lib/strategy-api";

export default async function AccessPage() {
  const [roles, accounts] = await Promise.all([
    getAdminRoles().catch(() => ({ data: [] })),
    getAdminAccounts().catch(() => ({ data: [] })),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="权限治理"
        title="角色与授权"
        description="查看角色定义，并为管理员账号分配后台权限。"
      />
      <AdminAccessConsole
        accounts={accounts.data}
        apiBaseUrl={resolveApiBaseUrl()}
        roles={roles.data}
      />
    </>
  );
}

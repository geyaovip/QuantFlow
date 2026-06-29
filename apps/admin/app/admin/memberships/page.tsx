import { PageHeader } from "@quantflow/ui";

import { AdminInviteCodesConsole } from "../../../components/admin-invite-codes-console";
import { AdminMembershipsConsole } from "../../../components/admin-memberships-console";
import { AdminPaymentAuditTable } from "../../../components/admin-payment-audit-table";
import {
  getAdminInviteCodes,
  getAdminMembershipPayments,
  getAdminSubscriptions,
} from "../../../lib/governance-api";
import { resolveApiBaseUrl } from "../../../lib/strategy-api";

export const metadata = { title: "会员管理" };

export default async function MembershipsPage() {
  const [subscriptions, inviteCodes, payments] = await Promise.all([
    getAdminSubscriptions().catch(() => ({
      data: [],
      pagination: { page: 1, pageSize: 50, total: 0, totalPages: 1 },
    })),
    getAdminInviteCodes().catch(() => ({
      data: [],
      pagination: { page: 1, pageSize: 50, total: 0, totalPages: 1 },
    })),
    getAdminMembershipPayments().catch(() => ({
      data: [],
      pagination: { page: 1, pageSize: 50, total: 0, totalPages: 1 },
    })),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="会员与订阅"
        title="会员管理"
        description="分页查看会员订阅记录、管理邀请码，支持取消有效订阅。人工开通请前往用户管理。"
      />
      <AdminInviteCodesConsole
        apiBaseUrl={resolveApiBaseUrl()}
        inviteCodes={inviteCodes.data}
      />
      <AdminPaymentAuditTable payments={payments.data} />
      <AdminMembershipsConsole
        apiBaseUrl={resolveApiBaseUrl()}
        subscriptions={subscriptions.data}
      />
    </>
  );
}

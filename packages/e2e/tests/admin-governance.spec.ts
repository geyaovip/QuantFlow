import { expect, test } from "@playwright/test";

import { loginAsAdmin } from "../helpers/admin-auth.js";
import { loginWithEmailOtp } from "../helpers/auth.js";

type Paginated<T> = {
  data: T[];
  pagination: { page: number; pageSize: number; total: number };
};

test.describe("Admin governance API", () => {
  test("admin can govern membership, signals, risk events, announcements, and audit logs", async ({
    request,
  }) => {
    const userSession = await loginWithEmailOtp(request);
    const adminSession = await loginAsAdmin(request);

    const dashboardResponse = await request.get(
      `${adminSession.authBaseUrl}/api/v1/admin/dashboard`,
    );
    expect(dashboardResponse.ok()).toBeTruthy();
    const dashboard = (await dashboardResponse.json()) as {
      data: {
        userCount: number;
        activeStrategyCount: number;
        openRiskEventCount: number;
      };
    };
    expect(dashboard.data.userCount).toBeGreaterThan(0);
    expect(dashboard.data.activeStrategyCount).toBeGreaterThan(0);
    expect(dashboard.data.openRiskEventCount).toBeGreaterThanOrEqual(0);

    const usersResponse = await request.get(
      `${adminSession.authBaseUrl}/api/v1/admin/users?page=1&pageSize=50`,
    );
    expect(usersResponse.ok()).toBeTruthy();
    const users = (await usersResponse.json()) as Paginated<{
      id: string;
      email: string;
      status: string;
    }>;
    expect(users.pagination.pageSize).toBe(50);
    const targetUser = users.data.find(
      (item) => item.email === userSession.email,
    );
    expect(targetUser?.id).toBeTruthy();

    const riskWatchResponse = await request.post(
      `${adminSession.authBaseUrl}/api/v1/admin/users/${targetUser?.id}/status`,
      {
        data: {
          status: "risk_watch",
          reason: "e2e 风控观察验证",
        },
      },
    );
    expect(riskWatchResponse.ok()).toBeTruthy();
    expect(
      ((await riskWatchResponse.json()) as { data: { status: string } }).data
        .status,
    ).toBe("risk_watch");

    const restoreUserResponse = await request.post(
      `${adminSession.authBaseUrl}/api/v1/admin/users/${targetUser?.id}/status`,
      {
        data: {
          status: "active",
          reason: "e2e 恢复用户状态",
        },
      },
    );
    expect(restoreUserResponse.ok()).toBeTruthy();

    const manualGrantResponse = await request.post(
      `${adminSession.authBaseUrl}/api/v1/admin/subscriptions/manual-grant`,
      {
        data: {
          userId: targetUser?.id,
          tier: "plus",
          billingCycle: "monthly",
          reason: "e2e 人工开通验证",
        },
      },
    );
    expect(manualGrantResponse.ok()).toBeTruthy();
    const manualGrant = (await manualGrantResponse.json()) as {
      data: { id: string; status: string; source: string; tier: string };
    };
    expect(manualGrant.data.status).toBe("active");
    expect(manualGrant.data.source).toBe("manual");
    expect(manualGrant.data.tier).toBe("plus");

    const cancelSubscriptionResponse = await request.post(
      `${adminSession.authBaseUrl}/api/v1/admin/subscriptions/${manualGrant.data.id}/cancel`,
      {
        data: {
          reason: "e2e 取消会员验证",
        },
      },
    );
    expect(cancelSubscriptionResponse.ok()).toBeTruthy();
    expect(
      (
        (await cancelSubscriptionResponse.json()) as {
          data: { status: string };
        }
      ).data.status,
    ).toBe("cancelled");

    const inviteCode = `ADM${Date.now().toString().slice(-8)}`;
    const createInviteResponse = await request.post(
      `${adminSession.authBaseUrl}/api/v1/admin/membership-invite-codes`,
      {
        data: {
          code: inviteCode,
          tier: "plus",
          billingCycle: "monthly",
          maxRedemptions: 2,
          note: "e2e admin governance",
          reason: "e2e 创建邀请码",
        },
      },
    );
    expect(createInviteResponse.ok()).toBeTruthy();
    const invite = (await createInviteResponse.json()) as {
      data: { id: string; codeLabel: string; status: string };
    };
    expect(invite.data.codeLabel).toBe(inviteCode);
    expect(invite.data.status).toBe("active");

    const disableInviteResponse = await request.post(
      `${adminSession.authBaseUrl}/api/v1/admin/membership-invite-codes/${invite.data.id}/disable`,
      {
        data: {
          reason: "e2e 停用邀请码",
        },
      },
    );
    expect(disableInviteResponse.ok()).toBeTruthy();
    expect(
      ((await disableInviteResponse.json()) as { data: { status: string } })
        .data.status,
    ).toBe("disabled");

    const createAnnouncementResponse = await request.post(
      `${adminSession.authBaseUrl}/api/v1/admin/announcements`,
      {
        data: {
          title: "E2E 系统公告",
          content: "这是一条 E2E 发布门禁公告。",
          reason: "e2e 创建公告",
        },
      },
    );
    expect(createAnnouncementResponse.ok()).toBeTruthy();
    const announcement = (await createAnnouncementResponse.json()) as {
      data: { id: string; status: string };
    };
    expect(announcement.data.status).toBe("draft");

    const publishAnnouncementResponse = await request.post(
      `${adminSession.authBaseUrl}/api/v1/admin/announcements/${announcement.data.id}/publish`,
      {
        data: {
          reason: "e2e 发布公告",
        },
      },
    );
    expect(publishAnnouncementResponse.ok()).toBeTruthy();
    expect(
      (
        (await publishAnnouncementResponse.json()) as {
          data: { status: string };
        }
      ).data.status,
    ).toBe("published");

    const signalsResponse = await request.get(
      `${adminSession.authBaseUrl}/api/v1/admin/signals?page=1&pageSize=50&status=active`,
    );
    expect(signalsResponse.ok()).toBeTruthy();
    const signals = (await signalsResponse.json()) as Paginated<{
      id: string;
      status: string;
    }>;
    expect(signals.data.length).toBeGreaterThan(0);
    const signal = signals.data[0];

    const abnormalSignalResponse = await request.post(
      `${adminSession.authBaseUrl}/api/v1/admin/signals/${signal.id}/mark-abnormal`,
      {
        data: {
          reason: "e2e 信号异常验证",
        },
      },
    );
    expect(abnormalSignalResponse.ok()).toBeTruthy();
    expect(
      ((await abnormalSignalResponse.json()) as { data: { status: string } })
        .data.status,
    ).toBe("risk_blocked");

    const riskEventsResponse = await request.get(
      `${adminSession.authBaseUrl}/api/v1/admin/risk-events?page=1&pageSize=50`,
    );
    expect(riskEventsResponse.ok()).toBeTruthy();
    const riskEvents = (await riskEventsResponse.json()) as Paginated<{
      id: string;
      signalId: string | null;
      status: string;
      type: string;
    }>;
    const signalRiskEvent = riskEvents.data.find(
      (item) => item.signalId === signal.id && item.type === "signal_abnormal",
    );
    expect(signalRiskEvent?.id).toBeTruthy();

    const resolveRiskResponse = await request.post(
      `${adminSession.authBaseUrl}/api/v1/admin/risk-events/${signalRiskEvent?.id}/resolve`,
      {
        data: {
          reason: "e2e 处理风险事件",
          resolution: "已确认异常并阻断信号",
        },
      },
    );
    expect(resolveRiskResponse.ok()).toBeTruthy();
    expect(
      ((await resolveRiskResponse.json()) as { data: { status: string } }).data
        .status,
    ).toBe("resolved");

    const rolesResponse = await request.get(
      `${adminSession.authBaseUrl}/api/v1/admin/roles`,
    );
    expect(rolesResponse.ok()).toBeTruthy();
    const roles = (await rolesResponse.json()) as {
      data: Array<{ name: string; permissions: string[] }>;
    };
    expect(roles.data.some((role) => role.name === "super_admin")).toBe(true);

    const adminUsersResponse = await request.get(
      `${adminSession.authBaseUrl}/api/v1/admin/admin-users`,
    );
    expect(adminUsersResponse.ok()).toBeTruthy();
    const adminUsers = (await adminUsersResponse.json()) as {
      data: Array<{ email: string; roles: string[] }>;
    };
    const currentAdmin = adminUsers.data.find(
      (item) => item.email === adminSession.email,
    );
    expect(currentAdmin?.roles).toContain("super_admin");

    const auditResponse = await request.get(
      `${adminSession.authBaseUrl}/api/v1/admin/audit-logs?page=1&pageSize=50`,
    );
    expect(auditResponse.ok()).toBeTruthy();
    const auditLogs = (await auditResponse.json()) as Paginated<{
      action: string;
      reason: string;
    }>;
    expect(auditLogs.pagination.pageSize).toBe(50);
    for (const action of [
      "user_status_update",
      "membership_manual_grant",
      "membership_cancel",
      "membership_invite_create",
      "membership_invite_disable",
      "announcement_create",
      "announcement_publish",
      "signal.mark_abnormal",
      "risk_resolve",
    ]) {
      expect(auditLogs.data.some((log) => log.action === action)).toBe(true);
    }
  });
});

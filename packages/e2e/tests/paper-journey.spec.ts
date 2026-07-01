import { expect, test } from "@playwright/test";

import { loginAsAdmin } from "../helpers/admin-auth.js";
import { loginWithEmailOtp, SEED_FREE_STRATEGY_ID } from "../helpers/auth.js";

const SEED_EXPIRED_SIGNAL_ID = "11111111-1111-4111-8111-111111111114";

test.describe("Paper trading journey API", () => {
  test("subscribe, create simulated account, inspect resources, and track risk acceptance", async ({
    request,
  }) => {
    const { authBaseUrl, email } = await loginWithEmailOtp(request);

    const subscribeResponse = await request.post(
      `${authBaseUrl}/api/v1/strategies/${SEED_FREE_STRATEGY_ID}/subscriptions`,
      {
        data: {
          riskDisclosureVersion: "risk-v1",
          riskAccepted: true,
        },
      },
    );
    expect(subscribeResponse.ok()).toBeTruthy();

    const createResponse = await request.post(
      `${authBaseUrl}/api/v1/paper-accounts`,
      {
        data: {
          strategyId: SEED_FREE_STRATEGY_ID,
          symbol: "BTCUSDT",
          name: "E2E 模拟盘",
          initialBalance: "10000.00",
          maxPositionPct: "0.10",
          maxPositions: 3,
          riskDisclosureVersion: "risk-v1",
          riskAccepted: true,
        },
      },
    );
    expect(createResponse.ok()).toBeTruthy();
    const created = (await createResponse.json()) as {
      data: { id: string; status: string };
    };
    expect(created.data.status).toBe("running");

    const listResponse = await request.get(
      `${authBaseUrl}/api/v1/paper-accounts`,
    );
    expect(listResponse.ok()).toBeTruthy();
    const list = (await listResponse.json()) as {
      data: Array<{ id: string }>;
    };
    expect(list.data.some((account) => account.id === created.data.id)).toBe(
      true,
    );

    const detailResponse = await request.get(
      `${authBaseUrl}/api/v1/paper-accounts/${created.data.id}`,
    );
    expect(detailResponse.ok()).toBeTruthy();
    const detail = (await detailResponse.json()) as {
      data: {
        currentEquity: string;
        maxDrawdown: string;
        performance: unknown[];
        positions: unknown[];
        recentTrades: unknown[];
        riskDisclosure: string;
        riskEvents: unknown[];
      };
    };
    expect(detail.data.currentEquity).toBeTruthy();
    expect(detail.data.maxDrawdown).toBeTruthy();
    expect(Array.isArray(detail.data.positions)).toBeTruthy();
    expect(Array.isArray(detail.data.recentTrades)).toBeTruthy();
    expect(Array.isArray(detail.data.performance)).toBeTruthy();
    expect(Array.isArray(detail.data.riskEvents)).toBeTruthy();
    expect(detail.data.riskDisclosure).toContain("不承诺任何收益");

    for (const resource of [
      "positions",
      "orders",
      "trades",
      "performance",
      "risk-events",
    ]) {
      const resourceResponse = await request.get(
        `${authBaseUrl}/api/v1/paper-accounts/${created.data.id}/${resource}?page=1&pageSize=20`,
      );
      expect(resourceResponse.ok()).toBeTruthy();
      const resourceBody = (await resourceResponse.json()) as {
        pagination: { page: number; pageSize: number; total: number };
      };
      expect(resourceBody.pagination.page).toBe(1);
      expect(resourceBody.pagination.pageSize).toBe(20);
      expect(resourceBody.pagination.total).toBeGreaterThanOrEqual(0);
    }

    const pauseResponse = await request.post(
      `${authBaseUrl}/api/v1/paper-accounts/${created.data.id}/pause`,
    );
    expect(pauseResponse.ok()).toBeTruthy();
    expect(
      ((await pauseResponse.json()) as { data: { status: string } }).data
        .status,
    ).toBe("paused");

    const resetResponse = await request.post(
      `${authBaseUrl}/api/v1/paper-accounts/${created.data.id}/reset`,
      {
        data: {
          riskDisclosureVersion: "risk-v1",
          riskAccepted: true,
        },
      },
    );
    expect(resetResponse.ok()).toBeTruthy();
    expect(
      ((await resetResponse.json()) as { data: { status: string } }).data
        .status,
    ).toBe("running");

    const pauseAfterResetResponse = await request.post(
      `${authBaseUrl}/api/v1/paper-accounts/${created.data.id}/pause`,
    );
    expect(pauseAfterResetResponse.ok()).toBeTruthy();

    const resumeResponse = await request.post(
      `${authBaseUrl}/api/v1/paper-accounts/${created.data.id}/resume`,
    );
    expect(resumeResponse.ok()).toBeTruthy();
    expect(
      ((await resumeResponse.json()) as { data: { status: string } }).data
        .status,
    ).toBe("running");

    const deleteRunningResponse = await request.delete(
      `${authBaseUrl}/api/v1/paper-accounts/${created.data.id}`,
    );
    expect(deleteRunningResponse.status()).toBe(409);

    const upgradeResponse = await request.post(
      `${authBaseUrl}/api/v1/membership/mock-checkout`,
      {
        data: {
          tier: "plus",
          billingCycle: "monthly",
          riskAccepted: true,
        },
      },
    );
    expect(upgradeResponse.ok()).toBeTruthy();

    const copyResponse = await request.post(
      `${authBaseUrl}/api/v1/paper-accounts/${created.data.id}/copies`,
      {
        data: {
          name: "E2E 模拟盘副本",
          riskDisclosureVersion: "risk-v1",
          riskAccepted: true,
        },
      },
    );
    expect(copyResponse.ok()).toBeTruthy();
    const copied = (await copyResponse.json()) as {
      data: { id: string; name: string; status: string };
    };
    expect(copied.data.id).not.toBe(created.data.id);
    expect(copied.data.name).toBe("E2E 模拟盘副本");
    expect(copied.data.status).toBe("running");

    const endCopiedResponse = await request.post(
      `${authBaseUrl}/api/v1/paper-accounts/${copied.data.id}/end`,
    );
    expect(endCopiedResponse.ok()).toBeTruthy();
    expect(
      ((await endCopiedResponse.json()) as { data: { status: string } }).data
        .status,
    ).toBe("ended");

    const deleteCopiedResponse = await request.delete(
      `${authBaseUrl}/api/v1/paper-accounts/${copied.data.id}`,
    );
    expect(deleteCopiedResponse.status()).toBe(204);

    const deletedCopiedDetailResponse = await request.get(
      `${authBaseUrl}/api/v1/paper-accounts/${copied.data.id}`,
    );
    expect(deletedCopiedDetailResponse.status()).toBe(404);

    const beforeExpiredSignalResponse = await request.get(
      `${authBaseUrl}/api/v1/paper-accounts?page=1&pageSize=20`,
    );
    const beforeExpiredSignal = (await beforeExpiredSignalResponse.json()) as {
      pagination: { total: number };
    };
    const expiredSignalCreateResponse = await request.post(
      `${authBaseUrl}/api/v1/paper-accounts`,
      {
        data: {
          strategyId: SEED_FREE_STRATEGY_ID,
          symbol: "BTCUSDT",
          name: "E2E 过期信号模拟盘",
          initialBalance: "10000.00",
          maxPositionPct: "0.10",
          maxPositions: 3,
          signalId: SEED_EXPIRED_SIGNAL_ID,
          riskDisclosureVersion: "risk-v1",
          riskAccepted: true,
        },
      },
    );
    expect(expiredSignalCreateResponse.status()).toBe(403);
    const afterExpiredSignalResponse = await request.get(
      `${authBaseUrl}/api/v1/paper-accounts?page=1&pageSize=20`,
    );
    const afterExpiredSignal = (await afterExpiredSignalResponse.json()) as {
      pagination: { total: number };
    };
    expect(afterExpiredSignal.pagination.total).toBe(
      beforeExpiredSignal.pagination.total,
    );

    const admin = await loginAsAdmin(request);
    const usersResponse = await request.get(
      `${admin.authBaseUrl}/api/v1/admin/users?page=1&pageSize=50`,
    );
    expect(usersResponse.ok()).toBeTruthy();
    const users = (await usersResponse.json()) as {
      data: Array<{ id: string; email: string }>;
    };
    const user = users.data.find((item) => item.email === email);
    expect(user?.id).toBeTruthy();
    const userDetailResponse = await request.get(
      `${admin.authBaseUrl}/api/v1/admin/users/${user?.id}`,
    );
    expect(userDetailResponse.ok()).toBeTruthy();
    const userDetail = (await userDetailResponse.json()) as {
      data: {
        riskAcceptances: Array<{ context: string }>;
      };
    };
    expect(
      userDetail.data.riskAcceptances.some(
        (item) => item.context === "strategy_subscribe",
      ),
    ).toBe(true);
    expect(
      userDetail.data.riskAcceptances.some(
        (item) => item.context === "paper_account_create",
      ),
    ).toBe(true);
  });
});

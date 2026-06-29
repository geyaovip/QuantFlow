import { expect, test } from "@playwright/test";

import { loginWithEmailOtp, SEED_FREE_STRATEGY_ID } from "../helpers/auth.js";

test.describe("Paper trading journey API", () => {
  test("subscribe, create simulated account, and list accounts", async ({
    request,
  }) => {
    const { authBaseUrl } = await loginWithEmailOtp(request);

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
  });
});

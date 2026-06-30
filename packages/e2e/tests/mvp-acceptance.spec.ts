import { expect, test } from "@playwright/test";

import { loginAsAdmin } from "../helpers/admin-auth.js";
import { loginWithEmailOtp, SEED_FREE_STRATEGY_ID } from "../helpers/auth.js";

const apiURL = process.env.E2E_API_URL ?? "http://127.0.0.1:3002";
const SEED_EXPIRED_SIGNAL_ID = "11111111-1111-4111-8111-111111111114";

test.describe("MVP acceptance API", () => {
  test("strategy list supports period sort and free filter", async ({
    request,
  }) => {
    const sevenDayResponse = await request.get(
      `${apiURL}/api/v1/strategies?page=1&pageSize=20&period=seven_days&sortBy=returnRate`,
    );
    expect(sevenDayResponse.ok()).toBeTruthy();
    const sevenDayBody = (await sevenDayResponse.json()) as {
      data: Array<{ metric: { maxDrawdown: string; returnRate: string } }>;
    };
    expect(sevenDayBody.data.length).toBeGreaterThan(0);
    expect(sevenDayBody.data[0]?.metric.maxDrawdown).toBeTruthy();
    expect(sevenDayBody.data[0]?.metric.returnRate).toBeTruthy();

    const freeResponse = await request.get(
      `${apiURL}/api/v1/strategies?page=1&pageSize=20&access=free`,
    );
    expect(freeResponse.ok()).toBeTruthy();

    const drawdownResponse = await request.get(
      `${apiURL}/api/v1/strategies?page=1&pageSize=20&period=thirty_days&maxDrawdownLte=0.10`,
    );
    expect(drawdownResponse.ok()).toBeTruthy();
  });

  test("signal list allows all statuses when status is omitted", async ({
    request,
  }) => {
    const { authBaseUrl } = await loginWithEmailOtp(request);
    const response = await request.get(
      `${authBaseUrl}/api/v1/signals?page=1&pageSize=20`,
    );
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as {
      pagination: { total: number };
    };
    expect(body.pagination.total).toBeGreaterThanOrEqual(0);
  });

  test("expired signals are not returned as active signals", async ({
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

    const expiredResponse = await request.get(
      `${authBaseUrl}/api/v1/signals?page=1&pageSize=20&status=expired`,
    );
    expect(expiredResponse.ok()).toBeTruthy();
    const expiredBody = (await expiredResponse.json()) as {
      data: Array<{ id: string; status: string }>;
    };
    const expiredSeedSignal = expiredBody.data.find(
      (item) => item.id === SEED_EXPIRED_SIGNAL_ID,
    );
    expect(expiredSeedSignal?.status).toBe("expired");

    const activeResponse = await request.get(
      `${authBaseUrl}/api/v1/signals?page=1&pageSize=20&status=active`,
    );
    expect(activeResponse.ok()).toBeTruthy();
    const activeBody = (await activeResponse.json()) as {
      data: Array<{ id: string; status: string }>;
    };
    expect(
      activeBody.data.some((item) => item.id === SEED_EXPIRED_SIGNAL_ID),
    ).toBe(false);
  });

  test("admin can inspect user detail for operational support", async ({
    request,
  }) => {
    const userSession = await loginWithEmailOtp(request);
    const adminSession = await loginAsAdmin(request);
    const listResponse = await request.get(
      `${adminSession.authBaseUrl}/api/v1/admin/users?page=1&pageSize=50`,
    );
    expect(listResponse.ok()).toBeTruthy();
    const listBody = (await listResponse.json()) as {
      data: Array<{ id: string; email: string }>;
    };
    const user = listBody.data.find((item) => item.email === userSession.email);
    expect(user?.id).toBeTruthy();

    const detailResponse = await request.get(
      `${adminSession.authBaseUrl}/api/v1/admin/users/${user?.id}`,
    );
    expect(detailResponse.ok()).toBeTruthy();
    const detailBody = (await detailResponse.json()) as {
      data: {
        email: string;
        subscriptions: unknown[];
        strategySubscriptions: unknown[];
        paperAccounts: unknown[];
        riskAcceptances: unknown[];
      };
    };
    expect(detailBody.data.email).toBe(userSession.email);
    expect(Array.isArray(detailBody.data.riskAcceptances)).toBeTruthy();

    const paymentsResponse = await request.get(
      `${adminSession.authBaseUrl}/api/v1/admin/membership-payments?page=1&pageSize=50`,
    );
    expect(paymentsResponse.ok()).toBeTruthy();
  });

  test("invite redeem rejects invalid unauthenticated requests", async ({
    request,
  }) => {
    const response = await request.post(
      `${apiURL}/api/v1/membership/redeem-invite`,
      {
        data: {},
      },
    );
    expect([401, 422]).toContain(response.status());
  });
});

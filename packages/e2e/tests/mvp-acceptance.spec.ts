import { expect, test } from "@playwright/test";

import { loginWithEmailOtp } from "../helpers/auth.js";

const apiURL = process.env.E2E_API_URL ?? "http://127.0.0.1:3002";

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

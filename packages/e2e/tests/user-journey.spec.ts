import { expect, test } from "@playwright/test";

import { loginWithEmailOtp } from "../helpers/auth.js";

test.describe("User journey API", () => {
  test("login, list strategies, and read membership plans", async ({
    request,
  }) => {
    const { authBaseUrl } = await loginWithEmailOtp(request);

    const strategiesResponse = await request.get(
      `${authBaseUrl}/api/v1/strategies?page=1&pageSize=20`,
    );
    expect(strategiesResponse.ok()).toBeTruthy();
    const strategies = (await strategiesResponse.json()) as {
      data: unknown[];
      pagination: { total: number };
    };
    expect(strategies.pagination.total).toBeGreaterThan(0);
    expect(strategies.data.length).toBeGreaterThan(0);

    const plansResponse = await request.get(
      `${authBaseUrl}/api/v1/membership/plans`,
    );
    expect(plansResponse.ok()).toBeTruthy();
    const plans = (await plansResponse.json()) as {
      data: Array<{ tier: string }>;
    };
    expect(plans.data.some((plan) => plan.tier === "free")).toBeTruthy();

    const sessionResponse = await request.get(
      `${authBaseUrl}/api/v1/auth/session?audience=user`,
    );
    expect(sessionResponse.ok()).toBeTruthy();
    const session = (await sessionResponse.json()) as {
      data: { audience: string };
    };
    expect(session.data.audience).toBe("user");
  });
});

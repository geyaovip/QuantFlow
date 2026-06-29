import { expect, test } from "@playwright/test";

import { loginAsAdmin } from "../helpers/admin-auth.js";
import { loginWithEmailOtp } from "../helpers/auth.js";

test.describe("Invite code journey", () => {
  test("admin creates invite code and user redeems it", async ({ request }) => {
    const admin = await loginAsAdmin(request);
    const inviteCode = `E2E${Date.now().toString().slice(-8)}`;

    const createResponse = await request.post(
      `${admin.authBaseUrl}/api/v1/admin/membership-invite-codes`,
      {
        data: {
          code: inviteCode,
          tier: "pro",
          billingCycle: "monthly",
          maxRedemptions: 1,
          note: "e2e invite",
          reason: "e2e acceptance journey",
        },
      },
    );
    expect(createResponse.ok()).toBeTruthy();
    const created = (await createResponse.json()) as {
      data: { codeLabel: string; status: string };
    };
    expect(created.data.status).toBe("active");
    expect(created.data.codeLabel).toBeTruthy();

    const user = await loginWithEmailOtp(request);
    const redeemResponse = await request.post(
      `${user.authBaseUrl}/api/v1/membership/redeem-invite`,
      {
        data: {
          code: inviteCode,
          riskDisclosureVersion: "risk-v1",
          riskAccepted: true,
        },
      },
    );
    expect(redeemResponse.ok()).toBeTruthy();
    const subscription = (await redeemResponse.json()) as {
      data: { source: string; tier: string };
    };
    expect(subscription.data.source).toBe("invite");
    expect(subscription.data.tier).toBe("pro");

    const duplicateResponse = await request.post(
      `${user.authBaseUrl}/api/v1/membership/redeem-invite`,
      {
        data: {
          code: inviteCode,
          riskDisclosureVersion: "risk-v1",
          riskAccepted: true,
        },
      },
    );
    expect(duplicateResponse.status()).toBe(409);
  });
});

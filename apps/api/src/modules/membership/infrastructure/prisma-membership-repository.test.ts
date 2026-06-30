import { describe, expect, it, vi } from "vitest";

import { PrismaMembershipRepository } from "./prisma-membership-repository.js";
import {
  MembershipInviteAlreadyRedeemedError,
  MembershipInviteNotFoundError,
  MembershipRiskNotAcceptedError,
} from "../domain/membership-errors.js";
import type { RiskAcceptanceService } from "../application/risk-acceptance.service.js";

function createRepository(overrides: {
  prisma: Record<string, unknown>;
  riskAcceptance?: Pick<RiskAcceptanceService, "record">;
}) {
  return new PrismaMembershipRepository(
    overrides.prisma as never,
    (overrides.riskAcceptance ?? { record: vi.fn() }) as RiskAcceptanceService,
  );
}

describe("PrismaMembershipRepository.redeemInviteCode", () => {
  it("rejects when risk is not accepted", async () => {
    const repository = createRepository({ prisma: {} });

    await expect(
      repository.redeemInviteCode("user-1", {
        code: "QF-PRO",
        riskDisclosureVersion: "risk-v1",
        riskAccepted: false as never,
      }),
    ).rejects.toBeInstanceOf(MembershipRiskNotAcceptedError);
  });

  it("rejects unknown invite codes", async () => {
    const repository = createRepository({
      prisma: {
        membershipInviteCode: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      },
    });

    await expect(
      repository.redeemInviteCode("user-1", {
        code: "UNKNOWN",
        riskDisclosureVersion: "risk-v1",
        riskAccepted: true,
      }),
    ).rejects.toBeInstanceOf(MembershipInviteNotFoundError);
  });

  it("rejects duplicate redemption by same user", async () => {
    const repository = createRepository({
      prisma: {
        membershipInviteCode: {
          findUnique: vi.fn().mockResolvedValue({
            id: "invite-1",
            status: "active",
            expiresAt: null,
            redemptionCount: 0,
            maxRedemptions: 5,
            tier: "pro",
            billingCycle: "monthly",
            codeLabel: "QF-PRO",
          }),
        },
        membershipInviteRedemption: {
          findUnique: vi.fn().mockResolvedValue({ id: "redemption-1" }),
        },
      },
    });

    await expect(
      repository.redeemInviteCode("user-1", {
        code: "QF-PRO",
        riskDisclosureVersion: "risk-v1",
        riskAccepted: true,
      }),
    ).rejects.toBeInstanceOf(MembershipInviteAlreadyRedeemedError);
  });
});

describe("PrismaMembershipRepository.createPayment", () => {
  const plan = {
    id: "plan-plus",
    tier: "plus",
    name: "Plus",
    monthlyPriceUsd: { toString: () => "4.9" },
    yearlyPriceUsd: { toString: () => "49" },
  };
  const pendingPayment = {
    id: "payment-1",
    allowedPsysCids: ["USDT_BSC", "USDT"],
    amountUsd: { toString: () => "4.9" },
    billingCycle: "monthly",
    expiresAt: null,
    invoiceUrl: "https://plisio.net/invoice/reused",
    provider: "plisio",
    status: "pending",
  };

  it("reuses an existing pending invoice for the same plan and cycle", async () => {
    const createInvoice = vi.fn();
    const repository = createRepository({
      prisma: {
        membershipPlan: {
          findFirst: vi.fn().mockResolvedValue(plan),
        },
        user: {
          findUnique: vi.fn().mockResolvedValue({ email: "user@example.com" }),
        },
        membershipPayment: {
          findFirst: vi.fn().mockResolvedValue(pendingPayment),
        },
      },
    });

    const response = await repository.createPayment(
      "user-1",
      {
        tier: "plus",
        billingCycle: "monthly",
        riskAccepted: true,
      },
      createInvoice,
    );

    expect(response.data.id).toBe("payment-1");
    expect(response.data.invoiceUrl).toBe("https://plisio.net/invoice/reused");
    expect(createInvoice).not.toHaveBeenCalled();
  });

  it("waits for a recent in-progress payment before creating another invoice", async () => {
    const createInvoice = vi.fn();
    const membershipPayment = {
      findFirst: vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "payment-creating" })
        .mockResolvedValueOnce({
          ...pendingPayment,
          id: "payment-creating",
          invoiceUrl: "https://plisio.net/invoice/creating",
        }),
    };
    const repository = createRepository({
      prisma: {
        membershipPlan: {
          findFirst: vi.fn().mockResolvedValue(plan),
        },
        user: {
          findUnique: vi.fn().mockResolvedValue({ email: "user@example.com" }),
        },
        membershipPayment,
      },
    });
    const tunePolling = repository as unknown as {
      inProgressPaymentPollAttempts: number;
      inProgressPaymentPollMs: number;
    };
    tunePolling.inProgressPaymentPollAttempts = 1;
    tunePolling.inProgressPaymentPollMs = 0;

    const response = await repository.createPayment(
      "user-1",
      {
        tier: "plus",
        billingCycle: "monthly",
        riskAccepted: true,
      },
      createInvoice,
    );

    expect(response.data.id).toBe("payment-creating");
    expect(response.data.invoiceUrl).toBe(
      "https://plisio.net/invoice/creating",
    );
    expect(createInvoice).not.toHaveBeenCalled();
  });
});

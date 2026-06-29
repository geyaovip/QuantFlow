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

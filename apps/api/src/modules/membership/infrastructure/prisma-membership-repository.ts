import { Injectable } from "@nestjs/common";

import type {
  MembershipMockCheckout,
  MembershipPlanListResponse,
  MembershipSubscriptionResponse,
  UserEntitlements,
} from "@quantflow/contracts";

import { PrismaService } from "../../prisma/prisma.service.js";
import {
  MembershipCheckoutNotAllowedError,
  MembershipPlanNotFoundError,
  MembershipRiskNotAcceptedError,
} from "../domain/membership-errors.js";
import type { MembershipRepository } from "../domain/membership-repository.js";

const TIER_LABELS = {
  free: "Free",
  pro: "Pro",
  premium: "Premium",
} as const;

@Injectable()
export class PrismaMembershipRepository implements MembershipRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listPlans(): Promise<MembershipPlanListResponse> {
    const plans = await this.prisma.membershipPlan.findMany({
      where: { status: "active" },
      orderBy: { displayOrder: "asc" },
      include: { entitlements: { orderBy: { key: "asc" } } },
    });

    return {
      data: plans.map((plan) => ({
        tier: plan.tier,
        name: plan.name,
        monthlyPriceCny: plan.monthlyPriceCny.toString(),
        yearlyPriceCny: plan.yearlyPriceCny.toString(),
        entitlements: plan.entitlements.map((item) => ({
          key: item.key,
          valueType: item.valueType as "int" | "bool" | "string",
          value: item.value,
        })),
      })),
    };
  }

  async getUserSubscription(
    userId: string,
  ): Promise<MembershipSubscriptionResponse | null> {
    const subscription = await this.findActiveSubscription(userId);
    return subscription ? { data: subscription } : null;
  }

  async getUserEntitlements(userId: string): Promise<UserEntitlements> {
    const subscription = await this.findActiveSubscription(userId);
    if (!subscription) {
      return this.getFreeEntitlements();
    }

    const plan = await this.prisma.membershipPlan.findUnique({
      where: { tier: subscription.tier },
      include: { entitlements: true },
    });
    if (!plan) {
      return this.getFreeEntitlements();
    }

    return this.mapEntitlements(plan.tier, plan.name, plan.entitlements);
  }

  async mockCheckout(
    userId: string,
    input: MembershipMockCheckout,
  ): Promise<MembershipSubscriptionResponse> {
    if (!input.riskAccepted) {
      throw new MembershipRiskNotAcceptedError();
    }

    const plan = await this.prisma.membershipPlan.findFirst({
      where: { tier: input.tier, status: "active" },
    });
    if (!plan) {
      throw new MembershipPlanNotFoundError();
    }

    const now = new Date();
    const endsAt = new Date(now);
    if (input.billingCycle === "monthly") {
      endsAt.setMonth(endsAt.getMonth() + 1);
    } else {
      endsAt.setFullYear(endsAt.getFullYear() + 1);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userSubscription.updateMany({
        where: { userId, status: "active", endsAt: { gt: now } },
        data: { status: "cancelled", cancelledAt: now },
      });

      await tx.userSubscription.create({
        data: {
          userId,
          planId: plan.id,
          status: "active",
          source: "test",
          startsAt: now,
          endsAt,
          reason: "模拟开通（非真实扣款）",
        },
      });
    });

    const subscription = await this.findActiveSubscription(userId);
    if (!subscription) {
      throw new MembershipCheckoutNotAllowedError();
    }

    return { data: subscription };
  }

  private async findActiveSubscription(userId: string) {
    const now = new Date();
    const row = await this.prisma.userSubscription.findFirst({
      where: {
        userId,
        status: "active",
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
      include: { plan: true },
      orderBy: [{ endsAt: "desc" }, { id: "desc" }],
    });

    if (!row) {
      return null;
    }

    return {
      tier: row.plan.tier,
      planName: row.plan.name,
      status: row.status,
      source: row.source,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      cancelledAt: row.cancelledAt?.toISOString() ?? null,
    } satisfies MembershipSubscriptionResponse["data"];
  }

  private async getFreeEntitlements(): Promise<UserEntitlements> {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { tier: "free" },
      include: { entitlements: true },
    });
    if (!plan) {
      return {
        tier: "free",
        planName: "Free",
        strategySubscriptionsMax: 3,
        paperAccountsMax: 1,
        historyDays: 30,
      };
    }

    return this.mapEntitlements(plan.tier, plan.name, plan.entitlements);
  }

  private mapEntitlements(
    tier: UserEntitlements["tier"],
    planName: string,
    entitlements: Array<{ key: string; value: string }>,
  ): UserEntitlements {
    const lookup = new Map(entitlements.map((item) => [item.key, item.value]));

    return {
      tier,
      planName: planName || TIER_LABELS[tier],
      strategySubscriptionsMax: Number(
        lookup.get("strategy_subscriptions_max") ?? 3,
      ),
      paperAccountsMax: Number(lookup.get("paper_accounts_max") ?? 1),
      historyDays: Number(lookup.get("history_days") ?? 30),
    };
  }
}

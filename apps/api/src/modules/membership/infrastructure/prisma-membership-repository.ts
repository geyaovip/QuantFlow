import { Injectable } from "@nestjs/common";

import type {
  MembershipInviteRedeem,
  MembershipMockCheckout,
  MembershipCheckoutCreate,
  MembershipPaymentResponse,
  MembershipPlanListResponse,
  MembershipSubscriptionResponse,
  UserEntitlements,
} from "@quantflow/contracts";

import { PrismaService } from "../../prisma/prisma.service.js";
import {
  MembershipCheckoutNotAllowedError,
  MembershipInviteAlreadyRedeemedError,
  MembershipInviteDisabledError,
  MembershipInviteExhaustedError,
  MembershipInviteExpiredError,
  MembershipInviteNotFoundError,
  MembershipPlanNotFoundError,
  MembershipRiskNotAcceptedError,
} from "../domain/membership-errors.js";
import type { MembershipRepository } from "../domain/membership-repository.js";
import { RiskAcceptanceService } from "../application/risk-acceptance.service.js";

const TIER_LABELS = {
  free: "Free",
  pro: "Pro",
  premium: "Premium",
} as const;

@Injectable()
export class PrismaMembershipRepository implements MembershipRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly riskAcceptance: RiskAcceptanceService,
  ) {}

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

    await this.riskAcceptance.record(userId, "membership_checkout");

    const subscription = await this.findActiveSubscription(userId);
    if (!subscription) {
      throw new MembershipCheckoutNotAllowedError();
    }

    return { data: subscription };
  }

  async redeemInviteCode(
    userId: string,
    input: MembershipInviteRedeem,
  ): Promise<MembershipSubscriptionResponse> {
    if (!input.riskAccepted) {
      throw new MembershipRiskNotAcceptedError();
    }

    const codeNormalized = normalizeInviteCode(input.code);
    const invite = await this.prisma.membershipInviteCode.findUnique({
      where: { codeNormalized },
    });
    if (!invite) {
      throw new MembershipInviteNotFoundError();
    }
    if (invite.status !== "active") {
      throw new MembershipInviteDisabledError();
    }
    if (invite.expiresAt && invite.expiresAt <= new Date()) {
      throw new MembershipInviteExpiredError();
    }
    if (invite.redemptionCount >= invite.maxRedemptions) {
      throw new MembershipInviteExhaustedError();
    }

    const existingRedemption =
      await this.prisma.membershipInviteRedemption.findUnique({
        where: {
          inviteCodeId_userId: {
            inviteCodeId: invite.id,
            userId,
          },
        },
      });
    if (existingRedemption) {
      throw new MembershipInviteAlreadyRedeemedError();
    }

    const plan = await this.prisma.membershipPlan.findFirst({
      where: { tier: invite.tier, status: "active" },
    });
    if (!plan) {
      throw new MembershipPlanNotFoundError();
    }

    const now = new Date();
    const endsAt = new Date(now);
    if (invite.billingCycle === "monthly") {
      endsAt.setMonth(endsAt.getMonth() + 1);
    } else {
      endsAt.setFullYear(endsAt.getFullYear() + 1);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userSubscription.updateMany({
        where: { userId, status: "active", endsAt: { gt: now } },
        data: { status: "cancelled", cancelledAt: now },
      });

      const subscription = await tx.userSubscription.create({
        data: {
          userId,
          planId: plan.id,
          status: "active",
          source: "invite",
          startsAt: now,
          endsAt,
          reason: `邀请码 ${invite.codeLabel}`,
        },
      });

      await tx.membershipInviteRedemption.create({
        data: {
          inviteCodeId: invite.id,
          userId,
          subscriptionId: subscription.id,
        },
      });

      await tx.membershipInviteCode.update({
        where: { id: invite.id },
        data: { redemptionCount: { increment: 1 } },
      });
    });

    await this.riskAcceptance.record(userId, "membership_invite_redeem");

    const subscription = await this.findActiveSubscription(userId);
    if (!subscription) {
      throw new MembershipCheckoutNotAllowedError();
    }

    return { data: subscription };
  }

  async createPayment(
    userId: string,
    input: MembershipCheckoutCreate,
    createInvoice: Parameters<MembershipRepository["createPayment"]>[2],
  ): Promise<MembershipPaymentResponse> {
    if (!input.riskAccepted) {
      throw new MembershipRiskNotAcceptedError();
    }

    const plan = await this.prisma.membershipPlan.findFirst({
      where: { tier: input.tier, status: "active" },
    });
    if (!plan) {
      throw new MembershipPlanNotFoundError();
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    const amountCny =
      input.billingCycle === "monthly"
        ? plan.monthlyPriceCny.toString()
        : plan.yearlyPriceCny.toString();

    const payment = await this.prisma.membershipPayment.create({
      data: {
        userId,
        planId: plan.id,
        tier: plan.tier,
        billingCycle: input.billingCycle,
        provider: "plisio",
        status: "created",
        amountCny,
        allowedPsysCids: ["USDT_BSC", "USDT"],
      },
    });

    const invoice = await createInvoice({
      amountCny,
      email: user?.email,
      orderName: `QuantFlow ${plan.name} ${input.billingCycle === "monthly" ? "月付" : "年付"}`,
      orderNumber: payment.id,
    });

    const updated = await this.prisma.membershipPayment.update({
      where: { id: payment.id },
      data: {
        providerInvoiceId: invoice.txnId,
        invoiceUrl: invoice.invoiceUrl,
        rawPayload: toPrismaJson(invoice.rawPayload),
        status: "pending",
        expiresAt: invoice.expiresAt,
      },
    });

    return {
      data: {
        id: updated.id,
        tier: input.tier,
        billingCycle: input.billingCycle,
        status: updated.status,
        provider: "plisio",
        invoiceUrl: updated.invoiceUrl ?? invoice.invoiceUrl,
        amountCny: updated.amountCny.toString(),
        allowedCurrencies: ["USDT_BSC", "USDT"],
        expiresAt: updated.expiresAt?.toISOString() ?? null,
      },
    };
  }

  async completePaymentFromCallback(input: {
    orderNumber?: string;
    providerInvoiceId?: string;
    rawPayload: unknown;
    status: string;
  }): Promise<{ activated: boolean; userId?: string; planName?: string }> {
    const normalizedStatus = input.status.toLowerCase();
    const invoiceSelectors = [
      ...(input.providerInvoiceId
        ? [{ providerInvoiceId: input.providerInvoiceId }]
        : []),
      ...(input.orderNumber ? [{ id: input.orderNumber }] : []),
    ];
    const payment = await this.prisma.membershipPayment.findFirst({
      where: {
        provider: "plisio",
        OR: invoiceSelectors,
      },
      include: { plan: true },
    });

    if (!payment) {
      return { activated: false };
    }

    if (payment.status === "completed") {
      return { activated: false };
    }

    const now = new Date();
    const updateData = {
      rawPayload: toPrismaJson(input.rawPayload),
      status: normalizedStatus,
    };

    if (normalizedStatus !== "completed") {
      await this.prisma.membershipPayment.update({
        where: { id: payment.id },
        data: updateData,
      });
      return { activated: false };
    }

    const endsAt = new Date(now);
    if (payment.billingCycle === "yearly") {
      endsAt.setFullYear(endsAt.getFullYear() + 1);
    } else {
      endsAt.setMonth(endsAt.getMonth() + 1);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.membershipPayment.update({
        where: { id: payment.id },
        data: { ...updateData, paidAt: now },
      });

      await tx.userSubscription.updateMany({
        where: {
          userId: payment.userId,
          status: "active",
          endsAt: { gt: now },
        },
        data: { status: "cancelled", cancelledAt: now },
      });

      await tx.userSubscription.create({
        data: {
          userId: payment.userId,
          planId: payment.planId,
          status: "active",
          source: "plisio",
          startsAt: now,
          endsAt,
          reason: `Plisio invoice ${payment.providerInvoiceId ?? payment.id}`,
        },
      });
    });

    await this.riskAcceptance.record(payment.userId, "membership_checkout");

    return {
      activated: true,
      userId: payment.userId,
      planName: payment.plan.name,
    };
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

function toPrismaJson(value: unknown) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function normalizeInviteCode(code: string) {
  return code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

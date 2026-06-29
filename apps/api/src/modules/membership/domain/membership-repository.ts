import type {
  MembershipInviteRedeem,
  MembershipMockCheckout,
  MembershipCheckoutCreate,
  MembershipPaymentResponse,
  MembershipPlanListResponse,
  MembershipSubscriptionResponse,
  UserEntitlements,
} from "@quantflow/contracts";

export const MEMBERSHIP_REPOSITORY = Symbol("MEMBERSHIP_REPOSITORY");

export interface MembershipRepository {
  listPlans(): Promise<MembershipPlanListResponse>;
  getUserSubscription(
    userId: string,
  ): Promise<MembershipSubscriptionResponse | null>;
  getUserEntitlements(userId: string): Promise<UserEntitlements>;
  mockCheckout(
    userId: string,
    input: MembershipMockCheckout,
  ): Promise<MembershipSubscriptionResponse>;
  redeemInviteCode(
    userId: string,
    input: MembershipInviteRedeem,
  ): Promise<MembershipSubscriptionResponse>;
  createPayment(
    userId: string,
    input: MembershipCheckoutCreate,
    createInvoice: (input: {
      amountCny: string;
      email?: string;
      orderName: string;
      orderNumber: string;
    }) => Promise<{
      expiresAt: Date | null;
      invoiceUrl: string;
      rawPayload: unknown;
      txnId: string;
    }>,
  ): Promise<MembershipPaymentResponse>;
  completePaymentFromCallback(input: {
    orderNumber?: string;
    providerInvoiceId?: string;
    rawPayload: unknown;
    status: string;
  }): Promise<{ activated: boolean; userId?: string; planName?: string }>;
}

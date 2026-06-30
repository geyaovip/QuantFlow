import {
  membershipMockCheckoutSchema,
  membershipCheckoutCreateSchema,
  membershipPaymentResponseSchema,
  membershipPlanListResponseSchema,
  membershipSubscriptionResponseSchema,
  userEntitlementsSchema,
  type MembershipCheckoutCreate,
  type MembershipMockCheckout,
  type MembershipPaymentResponse,
  type MembershipPlanListResponse,
  type MembershipSubscriptionResponse,
  type UserEntitlements,
} from "@quantflow/contracts";

import { getJson, postJson } from "./strategy-api";

export async function getMembershipPlans(): Promise<MembershipPlanListResponse> {
  const payload = await getJson("/api/v1/membership/plans");
  return membershipPlanListResponseSchema.parse(payload);
}

export async function getMembershipSubscription(): Promise<MembershipSubscriptionResponse> {
  const payload = await getJson("/api/v1/membership/subscription");
  return membershipSubscriptionResponseSchema.parse(payload);
}

export async function getMembershipEntitlements(): Promise<UserEntitlements> {
  const payload = await getJson("/api/v1/membership/entitlements");
  return userEntitlementsSchema.parse(payload.data);
}

export async function mockCheckoutMembership(
  input: MembershipMockCheckout,
): Promise<MembershipSubscriptionResponse> {
  membershipMockCheckoutSchema.parse(input);
  const payload = await postJson("/api/v1/membership/mock-checkout", input);
  return membershipSubscriptionResponseSchema.parse(payload);
}

export async function createMembershipCheckout(
  input: MembershipCheckoutCreate,
): Promise<MembershipPaymentResponse> {
  membershipCheckoutCreateSchema.parse(input);
  const payload = await postJson("/api/v1/membership/checkout", input);
  return membershipPaymentResponseSchema.parse(payload);
}

export function resolveMembershipApiBaseUrl() {
  return "";
}

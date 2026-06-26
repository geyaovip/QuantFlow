import type {
  MembershipMockCheckout,
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
}

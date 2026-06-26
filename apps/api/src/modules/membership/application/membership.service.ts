import { Inject, Injectable } from "@nestjs/common";

import type {
  MembershipMockCheckout,
  MembershipPlanListResponse,
  MembershipSubscriptionResponse,
  UserEntitlements,
} from "@quantflow/contracts";

import {
  MEMBERSHIP_REPOSITORY,
  type MembershipRepository,
} from "../domain/membership-repository.js";

@Injectable()
export class MembershipService {
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly repository: MembershipRepository,
  ) {}

  listPlans(): Promise<MembershipPlanListResponse> {
    return this.repository.listPlans();
  }

  getSubscription(
    userId: string,
  ): Promise<MembershipSubscriptionResponse | null> {
    return this.repository.getUserSubscription(userId);
  }

  getEntitlements(userId: string): Promise<UserEntitlements> {
    return this.repository.getUserEntitlements(userId);
  }

  mockCheckout(
    userId: string,
    input: MembershipMockCheckout,
  ): Promise<MembershipSubscriptionResponse> {
    return this.repository.mockCheckout(userId, input);
  }
}

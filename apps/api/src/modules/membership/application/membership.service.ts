import { Inject, Injectable } from "@nestjs/common";

import type {
  MembershipMockCheckout,
  MembershipCheckoutCreate,
  MembershipPaymentResponse,
  MembershipPlanListResponse,
  MembershipSubscriptionResponse,
  UserEntitlements,
} from "@quantflow/contracts";

import { NotificationService } from "../../notification/application/notification.service.js";

import {
  MEMBERSHIP_REPOSITORY,
  type MembershipRepository,
} from "../domain/membership-repository.js";
import {
  MembershipPaymentCreateError,
  MembershipPaymentDisabledError,
} from "../domain/membership-errors.js";
import { PlisioClient } from "../infrastructure/plisio-client.js";

@Injectable()
export class MembershipService {
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly repository: MembershipRepository,
    private readonly plisioClient: PlisioClient,
    private readonly notificationService: NotificationService,
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

  async mockCheckout(
    userId: string,
    input: MembershipMockCheckout,
  ): Promise<MembershipSubscriptionResponse> {
    const result = await this.repository.mockCheckout(userId, input);
    await this.notificationService.notifyMembershipActivated(
      userId,
      result.data.planName,
    );
    return result;
  }

  async createPayment(
    userId: string,
    input: MembershipCheckoutCreate,
  ): Promise<MembershipPaymentResponse> {
    try {
      this.plisioClient.assertEnabled();
    } catch {
      throw new MembershipPaymentDisabledError();
    }

    try {
      return await this.repository.createPayment(
        userId,
        input,
        (invoiceInput) => this.plisioClient.createInvoice(invoiceInput),
      );
    } catch (error) {
      if (error instanceof Error && error.name.startsWith("Membership")) {
        throw error;
      }
      throw new MembershipPaymentCreateError();
    }
  }

  async handlePlisioCallback(payload: Record<string, unknown>) {
    if (!this.plisioClient.isCallbackSignatureValid(payload)) {
      throw new Error("invalid plisio callback signature");
    }

    const normalized = this.plisioClient.normalizeCallback(payload);
    if (
      (!normalized.providerInvoiceId && !normalized.orderNumber) ||
      !normalized.status
    ) {
      throw new Error("invalid plisio callback payload");
    }

    const result = await this.repository.completePaymentFromCallback({
      orderNumber: normalized.orderNumber,
      providerInvoiceId: normalized.providerInvoiceId,
      rawPayload: payload,
      status: normalized.status,
    });

    if (result.activated && result.userId && result.planName) {
      await this.notificationService.notifyMembershipActivated(
        result.userId,
        result.planName,
      );
    }
  }
}

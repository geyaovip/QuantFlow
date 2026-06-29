import { Inject, Injectable } from "@nestjs/common";

import type { AuditContext } from "../../strategy/domain/strategy-repository.js";
import { NotificationService } from "../../notification/application/notification.service.js";
import {
  GOVERNANCE_REPOSITORY,
  type GovernanceRepository,
  type ManualGrantInput,
} from "../domain/governance-repository.js";

@Injectable()
export class GovernanceService {
  constructor(
    @Inject(GOVERNANCE_REPOSITORY)
    private readonly repository: GovernanceRepository,
    private readonly notificationService: NotificationService,
  ) {}

  listUsers(page: number, pageSize: number) {
    return this.repository.listUsers(page, pageSize);
  }

  async getUserDetail(userId: string) {
    const data = await this.repository.getUserDetail(userId);
    return { data };
  }

  updateUserStatus(
    userId: string,
    status: "active" | "disabled" | "risk_watch",
    context: AuditContext,
  ) {
    return this.repository.updateUserStatus(userId, status, context);
  }

  listSubscriptions(page: number, pageSize: number) {
    return this.repository.listSubscriptions(page, pageSize);
  }

  listMembershipPayments(page: number, pageSize: number) {
    return this.repository.listMembershipPayments(page, pageSize);
  }

  async manualGrantMembership(input: ManualGrantInput, context: AuditContext) {
    const subscription = await this.repository.manualGrantMembership(
      input,
      context,
    );
    await this.notificationService.notifyMembershipActivated(
      input.userId,
      subscription.planName,
    );
    return { data: subscription };
  }

  cancelMembership(subscriptionId: string, context: AuditContext) {
    return this.repository
      .cancelMembership(subscriptionId, context)
      .then((data) => ({ data }));
  }

  listInviteCodes(page: number, pageSize: number) {
    return this.repository.listInviteCodes(page, pageSize);
  }

  createInviteCode(
    input: Parameters<GovernanceRepository["createInviteCode"]>[0],
    context: AuditContext,
  ) {
    return this.repository
      .createInviteCode(input, context)
      .then((data) => ({ data }));
  }

  disableInviteCode(inviteCodeId: string, context: AuditContext) {
    return this.repository
      .disableInviteCode(inviteCodeId, context)
      .then((data) => ({ data }));
  }

  listRiskEvents(page: number, pageSize: number) {
    return this.repository.listRiskEvents(page, pageSize);
  }

  updateRiskEvent(
    riskEventId: string,
    action: "assign" | "resolve" | "ignore" | "escalate",
    input: { reason: string; resolution?: string; assigneeAdminId?: string },
    context: AuditContext,
  ) {
    return this.repository
      .updateRiskEvent(riskEventId, action, input, context)
      .then((data) => ({ data }));
  }

  createRiskEvent(
    input: Parameters<GovernanceRepository["createRiskEvent"]>[0],
  ) {
    return this.repository.createRiskEvent(input);
  }

  async getDashboardSummary() {
    const data = await this.repository.getDashboardSummary();
    return { data };
  }

  async listRoles() {
    const data = await this.repository.listRoles();
    return { data };
  }

  async listAdminAccounts() {
    const data = await this.repository.listAdminAccounts();
    return { data };
  }

  assignAdminRole(adminUserId: string, roleId: string, context: AuditContext) {
    return this.repository
      .assignAdminRole(adminUserId, roleId, context)
      .then((data) => ({ data }));
  }

  listAnnouncements(page: number, pageSize: number) {
    return this.repository.listAnnouncements(page, pageSize);
  }

  createAnnouncement(
    input: { title: string; content: string; reason: string },
    context: AuditContext,
  ) {
    return this.repository
      .createAnnouncement(input, context)
      .then((data) => ({ data }));
  }

  async publishAnnouncement(announcementId: string, context: AuditContext) {
    const announcement = await this.repository.publishAnnouncement(
      announcementId,
      context,
    );
    const userIds = await this.repository.listActiveUserIds();
    await Promise.all(
      userIds.map((userId) =>
        this.notificationService.notifyUser({
          userId,
          type: "system",
          title: announcement.title,
          content: announcement.content,
        }),
      ),
    );
    return { data: announcement };
  }
}

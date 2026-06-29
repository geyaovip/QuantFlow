import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { z } from "zod";

import {
  adminMembershipActionSchema,
  adminMembershipInviteCreateSchema,
  adminMembershipManualGrantSchema,
  adminRiskActionSchema,
  adminUserStatusSchema,
  adminRoleAssignSchema,
  adminAnnouncementCreateSchema,
  adminStrategyActionSchema,
} from "@quantflow/contracts";

import { ADMIN_PERMISSIONS } from "../../admin-access/domain/admin-permissions.js";
import { AdminSessionService } from "../../admin-access/application/admin-session.service.js";
import { GovernanceService } from "../application/governance.service.js";

type RequestLike = {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
};

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

@Controller()
export class GovernanceController {
  constructor(
    private readonly governanceService: GovernanceService,
    private readonly adminSession: AdminSessionService,
  ) {}

  @Get("admin/dashboard")
  async dashboard(@Req() request: RequestLike) {
    try {
      await this.adminSession.requirePermission(
        request,
        ADMIN_PERMISSIONS.dashboardRead,
      );
      return this.governanceService.getDashboardSummary();
    } catch (error) {
      throw this.adminSession.toHttpError(error);
    }
  }

  @Get("admin/users")
  async listUsers(@Query() query: unknown, @Req() request: RequestLike) {
    const parsed = listQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }
    try {
      await this.adminSession.requirePermission(
        request,
        ADMIN_PERMISSIONS.usersRead,
      );
      return this.governanceService.listUsers(
        parsed.data.page ?? 1,
        parsed.data.pageSize ?? 50,
      );
    } catch (error) {
      throw this.adminSession.toHttpError(error);
    }
  }

  @Get("admin/users/:userId")
  async getUserDetail(
    @Param("userId") userId: string,
    @Req() request: RequestLike,
  ) {
    try {
      await this.adminSession.requirePermission(
        request,
        ADMIN_PERMISSIONS.usersRead,
      );
      return this.governanceService.getUserDetail(userId);
    } catch (error) {
      if (error instanceof Error && error.message === "用户不存在") {
        throw new HttpException("用户不存在", HttpStatus.NOT_FOUND);
      }
      throw this.adminSession.toHttpError(error);
    }
  }

  @Post("admin/users/:userId/status")
  async updateUserStatus(
    @Param("userId") userId: string,
    @Body() body: unknown,
    @Req() request: RequestLike,
  ) {
    const parsed = adminUserStatusSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }
    try {
      const session = await this.adminSession.requirePermission(
        request,
        ADMIN_PERMISSIONS.usersWrite,
      );
      const data = await this.governanceService.updateUserStatus(
        userId,
        parsed.data.status,
        this.adminSession.auditContext(
          request,
          session.subjectId,
          parsed.data.reason,
        ),
      );
      return { data };
    } catch (error) {
      throw this.adminSession.toHttpError(error);
    }
  }

  @Get("admin/subscriptions")
  async listSubscriptions(
    @Query() query: unknown,
    @Req() request: RequestLike,
  ) {
    const parsed = listQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }
    try {
      await this.adminSession.requirePermission(
        request,
        ADMIN_PERMISSIONS.membershipRead,
      );
      return this.governanceService.listSubscriptions(
        parsed.data.page ?? 1,
        parsed.data.pageSize ?? 50,
      );
    } catch (error) {
      throw this.adminSession.toHttpError(error);
    }
  }

  @Get("admin/membership-payments")
  async listMembershipPayments(
    @Query() query: unknown,
    @Req() request: RequestLike,
  ) {
    const parsed = listQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }
    try {
      await this.adminSession.requirePermission(
        request,
        ADMIN_PERMISSIONS.membershipRead,
      );
      return this.governanceService.listMembershipPayments(
        parsed.data.page ?? 1,
        parsed.data.pageSize ?? 50,
      );
    } catch (error) {
      throw this.adminSession.toHttpError(error);
    }
  }

  @Post("admin/subscriptions/manual-grant")
  async manualGrant(@Body() body: unknown, @Req() request: RequestLike) {
    const parsed = adminMembershipManualGrantSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }
    try {
      const session = await this.adminSession.requirePermission(
        request,
        ADMIN_PERMISSIONS.membershipWrite,
      );
      return this.governanceService.manualGrantMembership(parsed.data, {
        ...this.adminSession.auditContext(
          request,
          session.subjectId,
          parsed.data.reason,
        ),
        actorAdminId: session.subjectId,
      });
    } catch (error) {
      throw this.adminSession.toHttpError(error);
    }
  }

  @Post("admin/subscriptions/:subscriptionId/cancel")
  async cancelSubscription(
    @Param("subscriptionId") subscriptionId: string,
    @Body() body: unknown,
    @Req() request: RequestLike,
  ) {
    const parsed = adminMembershipActionSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }
    try {
      const session = await this.adminSession.requirePermission(
        request,
        ADMIN_PERMISSIONS.membershipWrite,
      );
      return this.governanceService.cancelMembership(
        subscriptionId,
        this.adminSession.auditContext(
          request,
          session.subjectId,
          parsed.data.reason,
        ),
      );
    } catch (error) {
      throw this.adminSession.toHttpError(error);
    }
  }

  @Get("admin/membership-invite-codes")
  async listInviteCodes(@Query() query: unknown, @Req() request: RequestLike) {
    const parsed = listQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }
    try {
      await this.adminSession.requirePermission(
        request,
        ADMIN_PERMISSIONS.membershipRead,
      );
      return this.governanceService.listInviteCodes(
        parsed.data.page ?? 1,
        parsed.data.pageSize ?? 50,
      );
    } catch (error) {
      throw this.adminSession.toHttpError(error);
    }
  }

  @Post("admin/membership-invite-codes")
  async createInviteCode(@Body() body: unknown, @Req() request: RequestLike) {
    const parsed = adminMembershipInviteCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }
    try {
      const session = await this.adminSession.requirePermission(
        request,
        ADMIN_PERMISSIONS.membershipWrite,
      );
      const { reason, ...input } = parsed.data;
      return this.governanceService.createInviteCode(input, {
        ...this.adminSession.auditContext(request, session.subjectId, reason),
        actorAdminId: session.subjectId,
      });
    } catch (error) {
      throw this.adminSession.toHttpError(error);
    }
  }

  @Post("admin/membership-invite-codes/:inviteCodeId/disable")
  async disableInviteCode(
    @Param("inviteCodeId") inviteCodeId: string,
    @Body() body: unknown,
    @Req() request: RequestLike,
  ) {
    const parsed = adminMembershipActionSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }
    try {
      const session = await this.adminSession.requirePermission(
        request,
        ADMIN_PERMISSIONS.membershipWrite,
      );
      return this.governanceService.disableInviteCode(
        inviteCodeId,
        this.adminSession.auditContext(
          request,
          session.subjectId,
          parsed.data.reason,
        ),
      );
    } catch (error) {
      throw this.adminSession.toHttpError(error);
    }
  }

  @Get("admin/risk-events")
  async listRiskEvents(@Query() query: unknown, @Req() request: RequestLike) {
    const parsed = listQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }
    try {
      await this.adminSession.requirePermission(
        request,
        ADMIN_PERMISSIONS.riskRead,
      );
      return this.governanceService.listRiskEvents(
        parsed.data.page ?? 1,
        parsed.data.pageSize ?? 50,
      );
    } catch (error) {
      throw this.adminSession.toHttpError(error);
    }
  }

  @Post("admin/risk-events/:riskEventId/:action")
  async updateRiskEvent(
    @Param("riskEventId") riskEventId: string,
    @Param("action") action: string,
    @Body() body: unknown,
    @Req() request: RequestLike,
  ) {
    const parsedAction = z
      .enum(["assign", "resolve", "ignore", "escalate"])
      .safeParse(action);
    const parsed = adminRiskActionSchema.safeParse(body);
    if (!parsedAction.success || !parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }
    try {
      const session = await this.adminSession.requirePermission(
        request,
        ADMIN_PERMISSIONS.riskWrite,
      );
      return this.governanceService.updateRiskEvent(
        riskEventId,
        parsedAction.data,
        parsed.data,
        this.adminSession.auditContext(
          request,
          session.subjectId,
          parsed.data.reason,
        ),
      );
    } catch (error) {
      throw this.adminSession.toHttpError(error);
    }
  }

  @Get("admin/roles")
  async listRoles(@Req() request: RequestLike) {
    try {
      await this.adminSession.requirePermission(
        request,
        ADMIN_PERMISSIONS.rolesManage,
      );
      return this.governanceService.listRoles();
    } catch (error) {
      throw this.adminSession.toHttpError(error);
    }
  }

  @Get("admin/admin-users")
  async listAdminUsers(@Req() request: RequestLike) {
    try {
      await this.adminSession.requirePermission(
        request,
        ADMIN_PERMISSIONS.rolesManage,
      );
      return this.governanceService.listAdminAccounts();
    } catch (error) {
      throw this.adminSession.toHttpError(error);
    }
  }

  @Post("admin/admin-users/:adminUserId/roles")
  async assignRole(
    @Param("adminUserId") adminUserId: string,
    @Body() body: unknown,
    @Req() request: RequestLike,
  ) {
    const parsed = adminRoleAssignSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }
    try {
      const session = await this.adminSession.requirePermission(
        request,
        ADMIN_PERMISSIONS.rolesManage,
      );
      return this.governanceService.assignAdminRole(
        adminUserId,
        parsed.data.roleId,
        this.adminSession.auditContext(
          request,
          session.subjectId,
          parsed.data.reason,
        ),
      );
    } catch (error) {
      throw this.adminSession.toHttpError(error);
    }
  }

  @Get("admin/announcements")
  async listAnnouncements(
    @Query() query: unknown,
    @Req() request: RequestLike,
  ) {
    const parsed = listQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }
    try {
      await this.adminSession.requirePermission(
        request,
        ADMIN_PERMISSIONS.dashboardRead,
      );
      return this.governanceService.listAnnouncements(
        parsed.data.page ?? 1,
        parsed.data.pageSize ?? 50,
      );
    } catch (error) {
      throw this.adminSession.toHttpError(error);
    }
  }

  @Post("admin/announcements")
  async createAnnouncement(@Body() body: unknown, @Req() request: RequestLike) {
    const parsed = adminAnnouncementCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }
    try {
      const session = await this.adminSession.requirePermission(
        request,
        ADMIN_PERMISSIONS.dashboardRead,
      );
      return this.governanceService.createAnnouncement(parsed.data, {
        ...this.adminSession.auditContext(
          request,
          session.subjectId,
          parsed.data.reason,
        ),
        actorAdminId: session.subjectId,
      });
    } catch (error) {
      throw this.adminSession.toHttpError(error);
    }
  }

  @Post("admin/announcements/:announcementId/publish")
  async publishAnnouncement(
    @Param("announcementId") announcementId: string,
    @Body() body: unknown,
    @Req() request: RequestLike,
  ) {
    const parsed = adminStrategyActionSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }
    try {
      const session = await this.adminSession.requirePermission(
        request,
        ADMIN_PERMISSIONS.dashboardRead,
      );
      return this.governanceService.publishAnnouncement(
        announcementId,
        this.adminSession.auditContext(
          request,
          session.subjectId,
          parsed.data.reason,
        ),
      );
    } catch (error) {
      throw this.adminSession.toHttpError(error);
    }
  }
}

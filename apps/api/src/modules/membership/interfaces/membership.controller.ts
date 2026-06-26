import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
} from "@nestjs/common";

import { membershipMockCheckoutSchema } from "@quantflow/contracts";

import { AuthService } from "../../auth/application/auth.service.js";
import { MembershipService } from "../application/membership.service.js";
import {
  MembershipCheckoutNotAllowedError,
  MembershipPlanNotFoundError,
  MembershipRiskNotAcceptedError,
} from "../domain/membership-errors.js";

type RequestLike = {
  headers: Record<string, string | string[] | undefined>;
};

@Controller()
export class MembershipController {
  constructor(
    private readonly membershipService: MembershipService,
    private readonly authService: AuthService,
  ) {}

  @Get("membership/plans")
  listPlans() {
    return this.membershipService.listPlans();
  }

  @Get("membership/subscription")
  async getSubscription(@Req() request: RequestLike) {
    const session = await this.requireUserSession(request);
    const subscription = await this.membershipService.getSubscription(
      session.subjectId,
    );

    if (!subscription) {
      const entitlements = await this.membershipService.getEntitlements(
        session.subjectId,
      );
      return {
        data: {
          tier: entitlements.tier,
          planName: entitlements.planName,
          status: "active" as const,
          source: "manual" as const,
          startsAt: new Date(0).toISOString(),
          endsAt: new Date("2099-12-31T00:00:00.000Z").toISOString(),
          cancelledAt: null,
        },
      };
    }

    return subscription;
  }

  @Get("membership/entitlements")
  async getEntitlements(@Req() request: RequestLike) {
    const session = await this.requireUserSession(request);
    const data = await this.membershipService.getEntitlements(
      session.subjectId,
    );
    return { data };
  }

  @Post("membership/mock-checkout")
  async mockCheckout(@Req() request: RequestLike, @Body() body: unknown) {
    const parsed = membershipMockCheckoutSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }

    try {
      const session = await this.requireUserSession(request);
      return await this.membershipService.mockCheckout(
        session.subjectId,
        parsed.data,
      );
    } catch (error) {
      throw toHttpError(error);
    }
  }

  private async requireUserSession(request: RequestLike) {
    const token = this.readCookie(request, "qf_user_session");
    return this.authService.validateSession(token, "user");
  }

  private readCookie(request: RequestLike, name: string) {
    const header = request.headers.cookie;
    if (!header || typeof header !== "string") {
      return undefined;
    }

    const match = header
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`));

    return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
  }
}

function toHttpError(error: unknown) {
  if (error instanceof MembershipPlanNotFoundError) {
    return new HttpException("会员计划不存在", HttpStatus.NOT_FOUND);
  }
  if (error instanceof MembershipRiskNotAcceptedError) {
    return new HttpException(
      "请先确认风险提示",
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
  if (error instanceof MembershipCheckoutNotAllowedError) {
    return new HttpException("当前无法完成开通", HttpStatus.CONFLICT);
  }

  throw error;
}

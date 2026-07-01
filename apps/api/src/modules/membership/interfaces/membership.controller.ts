import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Req,
} from "@nestjs/common";

import {
  membershipCheckoutCreateSchema,
  membershipInviteRedeemSchema,
  membershipMockCheckoutSchema,
} from "@quantflow/contracts";

import { AuthService } from "../../auth/application/auth.service.js";
import { MembershipService } from "../application/membership.service.js";
import {
  MembershipCheckoutNotAllowedError,
  MembershipInviteAlreadyRedeemedError,
  MembershipInviteDisabledError,
  MembershipInviteExhaustedError,
  MembershipInviteExpiredError,
  MembershipInviteNotFoundError,
  MembershipPaymentCallbackInvalidError,
  MembershipPaymentCreateError,
  MembershipPaymentDisabledError,
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
    if (process.env.NODE_ENV === "production") {
      throw new HttpException("接口不存在", HttpStatus.NOT_FOUND);
    }

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

  @Post("membership/redeem-invite")
  async redeemInvite(@Req() request: RequestLike, @Body() body: unknown) {
    const parsed = membershipInviteRedeemSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }

    try {
      const session = await this.requireUserSession(request);
      return await this.membershipService.redeemInviteCode(
        session.subjectId,
        parsed.data,
      );
    } catch (error) {
      throw toHttpError(error);
    }
  }

  @Post("membership/checkout")
  async createCheckout(@Req() request: RequestLike, @Body() body: unknown) {
    const parsed = membershipCheckoutCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }

    try {
      const session = await this.requireUserSession(request);
      return await this.membershipService.createPayment(
        session.subjectId,
        parsed.data,
      );
    } catch (error) {
      throw toHttpError(error);
    }
  }

  @Post("membership/plisio/callback")
  async handlePlisioCallback(@Body() body: unknown) {
    return this.processPlisioCallback(body);
  }

  @Get("membership/plisio/callback")
  async handlePlisioCallbackGet(@Query() query: Record<string, unknown>) {
    return this.processPlisioCallback(query);
  }

  private async processPlisioCallback(payload: unknown) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new HttpException("invalid callback", HttpStatus.BAD_REQUEST);
    }
    try {
      await this.membershipService.handlePlisioCallback(
        payload as Record<string, unknown>,
      );
      return { status: "ok" };
    } catch {
      throw toHttpError(new MembershipPaymentCallbackInvalidError());
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
  if (error instanceof MembershipInviteNotFoundError) {
    return new HttpException("邀请码无效", HttpStatus.NOT_FOUND);
  }
  if (error instanceof MembershipInviteDisabledError) {
    return new HttpException("邀请码已停用", HttpStatus.CONFLICT);
  }
  if (error instanceof MembershipInviteExpiredError) {
    return new HttpException("邀请码已过期", HttpStatus.CONFLICT);
  }
  if (error instanceof MembershipInviteExhaustedError) {
    return new HttpException("邀请码已达使用上限", HttpStatus.CONFLICT);
  }
  if (error instanceof MembershipInviteAlreadyRedeemedError) {
    return new HttpException("你已使用过该邀请码", HttpStatus.CONFLICT);
  }
  if (error instanceof MembershipCheckoutNotAllowedError) {
    return new HttpException("当前无法完成开通", HttpStatus.CONFLICT);
  }
  if (error instanceof MembershipPaymentDisabledError) {
    return new HttpException("生产支付尚未开启", HttpStatus.CONFLICT);
  }
  if (error instanceof MembershipPaymentCreateError) {
    return new HttpException("支付订单创建失败", HttpStatus.BAD_GATEWAY);
  }
  if (error instanceof MembershipPaymentCallbackInvalidError) {
    return new HttpException("支付回调无效", HttpStatus.BAD_REQUEST);
  }

  throw error;
}

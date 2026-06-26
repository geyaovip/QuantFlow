import {
  Body,
  Controller,
  Delete,
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
  adminStrategyActionSchema,
  adminStrategyCreateSchema,
} from "@quantflow/contracts";

import { AuthService } from "../../auth/application/auth.service.js";
import { StrategyService } from "../application/strategy.service.js";
import {
  SignalNotFoundError,
  StrategyInvalidStateError,
  StrategyNotFoundError,
  StrategySubscriptionLimitError,
} from "../domain/strategy-errors.js";

type RequestLike = {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
};

const listStrategiesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  riskLevel: z.enum(["low", "medium", "high", "critical"]).optional(),
  type: z.enum(["spot", "grid", "dca", "trend", "swing"]).optional(),
  symbol: z.string().min(3).optional(),
  sortBy: z.enum(["publishedAt", "riskLevel"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  period: z
    .enum(["seven_days", "thirty_days", "ninety_days", "all_time"])
    .optional(),
});

const listSignalsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  direction: z.enum(["buy", "sell", "watch"]).optional(),
  status: z
    .enum(["active", "expired", "cancelled", "strategy_paused", "risk_blocked"])
    .optional(),
});

@Controller()
export class StrategyController {
  constructor(
    private readonly strategyService: StrategyService,
    private readonly authService: AuthService,
  ) {}

  @Get("strategies")
  async listStrategies(@Query() query: unknown, @Req() request: RequestLike) {
    const parsed = listStrategiesQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }
    const session = await this.getOptionalSession(request, "user");

    return this.strategyService.listStrategies(parsed.data, session?.subjectId);
  }

  @Get("strategies/:strategyId")
  async getStrategy(
    @Param("strategyId") strategyId: string,
    @Req() request: RequestLike,
  ) {
    try {
      const session = await this.getOptionalSession(request, "user");
      return await this.strategyService.getStrategy(
        strategyId,
        session?.subjectId,
      );
    } catch (error) {
      throw toHttpError(error);
    }
  }

  @Post("strategies/:strategyId/subscriptions")
  async subscribeStrategy(
    @Param("strategyId") strategyId: string,
    @Req() request: RequestLike,
  ) {
    try {
      const session = await this.requireSession(request, "user");
      return await this.strategyService.subscribeToStrategy(
        session.subjectId,
        strategyId,
      );
    } catch (error) {
      throw toHttpError(error);
    }
  }

  @Delete("strategies/:strategyId/subscriptions/current")
  async cancelStrategySubscription(
    @Param("strategyId") strategyId: string,
    @Req() request: RequestLike,
  ) {
    try {
      const session = await this.requireSession(request, "user");
      return await this.strategyService.cancelStrategySubscription(
        session.subjectId,
        strategyId,
      );
    } catch (error) {
      throw toHttpError(error);
    }
  }

  @Get("signals")
  async listSignals(@Query() query: unknown, @Req() request: RequestLike) {
    const parsed = listSignalsQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }
    const session = await this.getOptionalSession(request, "user");

    return this.strategyService.listSignals(parsed.data, session?.subjectId);
  }

  @Get("signals/:signalId")
  async getSignal(
    @Param("signalId") signalId: string,
    @Req() request: RequestLike,
  ) {
    try {
      const session = await this.requireSession(request, "user");
      return await this.strategyService.getSignal(signalId, session.subjectId);
    } catch (error) {
      throw toHttpError(error);
    }
  }

  @Get("me/strategy-subscriptions")
  async listMyStrategySubscriptions(
    @Query() query: unknown,
    @Req() request: RequestLike,
  ) {
    const parsed = listStrategiesQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }
    const session = await this.requireSession(request, "user");
    return this.strategyService.listSubscribedStrategies(
      parsed.data,
      session.subjectId,
    );
  }

  @Get("admin/strategies")
  async listAdminStrategies(
    @Query() query: unknown,
    @Req() request: RequestLike,
  ) {
    await this.requireSession(request, "admin");
    const parsed = listStrategiesQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }
    return this.strategyService.listAdminStrategies(parsed.data);
  }

  @Post("admin/strategies")
  async createAdminStrategy(
    @Body() body: unknown,
    @Req() request: RequestLike,
  ) {
    const session = await this.requireSession(request, "admin");
    const parsed = adminStrategyCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }
    return this.strategyService.createAdminStrategy(
      parsed.data,
      auditContext(request, session.subjectId, parsed.data.reason),
    );
  }

  @Post("admin/strategies/:strategyId/submit-review")
  submitStrategyReview(
    @Param("strategyId") strategyId: string,
    @Body() body: unknown,
    @Req() request: RequestLike,
  ) {
    return this.runAdminAction(request, body, (input, context) =>
      this.strategyService.submitStrategyReview(strategyId, input, context),
    );
  }

  @Post("admin/strategies/:strategyId/approve")
  approveStrategy(
    @Param("strategyId") strategyId: string,
    @Body() body: unknown,
    @Req() request: RequestLike,
  ) {
    return this.runAdminAction(request, body, (input, context) =>
      this.strategyService.approveStrategy(strategyId, input, context),
    );
  }

  @Post("admin/strategies/:strategyId/reject")
  rejectStrategy(
    @Param("strategyId") strategyId: string,
    @Body() body: unknown,
    @Req() request: RequestLike,
  ) {
    return this.runAdminAction(request, body, (input, context) =>
      this.strategyService.rejectStrategy(strategyId, input, context),
    );
  }

  @Post("admin/strategies/:strategyId/pause")
  pauseStrategy(
    @Param("strategyId") strategyId: string,
    @Body() body: unknown,
    @Req() request: RequestLike,
  ) {
    return this.runAdminAction(request, body, (input, context) =>
      this.strategyService.pauseStrategy(strategyId, input, context),
    );
  }

  @Post("admin/strategies/:strategyId/delist")
  delistStrategy(
    @Param("strategyId") strategyId: string,
    @Body() body: unknown,
    @Req() request: RequestLike,
  ) {
    return this.runAdminAction(request, body, (input, context) =>
      this.strategyService.delistStrategy(strategyId, input, context),
    );
  }

  private async runAdminAction(
    request: RequestLike,
    body: unknown,
    action: (
      input: z.infer<typeof adminStrategyActionSchema>,
      context: ReturnType<typeof auditContext>,
    ) => Promise<unknown>,
  ) {
    try {
      const session = await this.requireSession(request, "admin");
      const parsed = adminStrategyActionSchema.safeParse(body);
      if (!parsed.success) {
        throw new HttpException(
          "请求参数有误",
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      return await action(
        parsed.data,
        auditContext(request, session.subjectId, parsed.data.reason),
      );
    } catch (error) {
      throw toHttpError(error);
    }
  }

  private async getOptionalSession(
    request: RequestLike,
    audience: "user" | "admin",
  ) {
    try {
      return await this.requireSession(request, audience);
    } catch {
      return null;
    }
  }

  private requireSession(request: RequestLike, audience: "user" | "admin") {
    return this.authService.validateSession(
      cookieValue(headerValue(request.headers.cookie), cookieName(audience)),
      audience,
    );
  }
}

function toHttpError(error: unknown) {
  if (error instanceof HttpException) {
    return error;
  }
  if (
    error instanceof StrategyNotFoundError ||
    error instanceof SignalNotFoundError
  ) {
    return new HttpException(error.message, HttpStatus.NOT_FOUND);
  }
  if (error instanceof StrategySubscriptionLimitError) {
    return new HttpException(error.message, HttpStatus.FORBIDDEN);
  }
  if (error instanceof StrategyInvalidStateError) {
    return new HttpException(error.message, HttpStatus.CONFLICT);
  }

  return new HttpException("服务暂时不可用", HttpStatus.INTERNAL_SERVER_ERROR);
}

function auditContext(
  request: RequestLike,
  actorAdminId: string,
  reason: string,
) {
  return {
    actorAdminId,
    reason,
    ip: request.ip,
    userAgent: headerValue(request.headers["user-agent"]),
  };
}

function cookieName(audience: "user" | "admin") {
  return audience === "admin" ? "qf_admin_session" : "qf_user_session";
}

function cookieValue(cookieHeader: string | undefined, name: string) {
  return cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function headerValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

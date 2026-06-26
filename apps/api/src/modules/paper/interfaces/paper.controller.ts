import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { z } from "zod";

import {
  adminPaperAccountActionSchema,
  paperAccountCopySchema,
  paperAccountCreateSchema,
  paperAccountResetSchema,
  paperExecuteSignalSchema,
} from "@quantflow/contracts";

import { AuthService } from "../../auth/application/auth.service.js";
import { PaperService } from "../application/paper.service.js";
import {
  PaperAccountInvalidStateError,
  PaperAccountLimitError,
  PaperAccountNotFoundError,
  PaperExecutionRejectedError,
  PaperMarketDataStaleError,
  PaperRiskNotAcceptedError,
} from "../domain/paper-errors.js";

type RequestLike = {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
};

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

@Controller()
export class PaperController {
  constructor(
    private readonly paperService: PaperService,
    private readonly authService: AuthService,
  ) {}

  @Get("paper-accounts")
  async listAccounts(@Query() query: unknown, @Req() request: RequestLike) {
    const parsed = listQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const session = await this.requireUserSession(request);
    return this.paperService.listAccounts(session.subjectId, parsed.data);
  }

  @Post("paper-accounts")
  async createAccount(@Req() request: RequestLike, @Body() body: unknown) {
    const parsed = paperAccountCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }

    try {
      const session = await this.requireUserSession(request);
      return await this.paperService.createAccount(
        session.subjectId,
        parsed.data,
      );
    } catch (error) {
      throw toHttpError(error);
    }
  }

  @Get("paper-accounts/:accountId")
  async getAccount(
    @Param("accountId") accountId: string,
    @Req() request: RequestLike,
  ) {
    try {
      const session = await this.requireUserSession(request);
      return await this.paperService.getAccount(session.subjectId, accountId);
    } catch (error) {
      throw toHttpError(error);
    }
  }

  @Get("paper-accounts/:accountId/positions")
  async listPositions(
    @Param("accountId") accountId: string,
    @Query() query: unknown,
    @Req() request: RequestLike,
  ) {
    return this.runListSubResource(
      request,
      accountId,
      query,
      (session, parsed) =>
        this.paperService.listPositions(session.subjectId, accountId, parsed),
    );
  }

  @Get("paper-accounts/:accountId/orders")
  async listOrders(
    @Param("accountId") accountId: string,
    @Query() query: unknown,
    @Req() request: RequestLike,
  ) {
    return this.runListSubResource(
      request,
      accountId,
      query,
      (session, parsed) =>
        this.paperService.listOrders(session.subjectId, accountId, parsed),
    );
  }

  @Get("paper-accounts/:accountId/trades")
  async listTrades(
    @Param("accountId") accountId: string,
    @Query() query: unknown,
    @Req() request: RequestLike,
  ) {
    return this.runListSubResource(
      request,
      accountId,
      query,
      (session, parsed) =>
        this.paperService.listTrades(session.subjectId, accountId, parsed),
    );
  }

  @Get("paper-accounts/:accountId/performance")
  async listPerformance(
    @Param("accountId") accountId: string,
    @Query() query: unknown,
    @Req() request: RequestLike,
  ) {
    return this.runListSubResource(
      request,
      accountId,
      query,
      (session, parsed) =>
        this.paperService.listPerformance(session.subjectId, accountId, parsed),
    );
  }

  @Get("paper-accounts/:accountId/risk-events")
  async listRiskEvents(
    @Param("accountId") accountId: string,
    @Query() query: unknown,
    @Req() request: RequestLike,
  ) {
    return this.runListSubResource(
      request,
      accountId,
      query,
      (session, parsed) =>
        this.paperService.listRiskEvents(session.subjectId, accountId, parsed),
    );
  }

  @Post("paper-accounts/:accountId/pause")
  async pauseAccount(
    @Param("accountId") accountId: string,
    @Req() request: RequestLike,
  ) {
    try {
      const session = await this.requireUserSession(request);
      return await this.paperService.pauseAccount(session.subjectId, accountId);
    } catch (error) {
      throw toHttpError(error);
    }
  }

  @Post("paper-accounts/:accountId/resume")
  async resumeAccount(
    @Param("accountId") accountId: string,
    @Req() request: RequestLike,
  ) {
    try {
      const session = await this.requireUserSession(request);
      return await this.paperService.resumeAccount(
        session.subjectId,
        accountId,
      );
    } catch (error) {
      throw toHttpError(error);
    }
  }

  @Post("paper-accounts/:accountId/reset")
  async resetAccount(
    @Param("accountId") accountId: string,
    @Req() request: RequestLike,
    @Body() body: unknown,
  ) {
    const parsed = paperAccountResetSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }

    try {
      const session = await this.requireUserSession(request);
      return await this.paperService.resetAccount(
        session.subjectId,
        accountId,
        parsed.data,
      );
    } catch (error) {
      throw toHttpError(error);
    }
  }

  @Post("paper-accounts/:accountId/end")
  async endAccount(
    @Param("accountId") accountId: string,
    @Req() request: RequestLike,
  ) {
    try {
      const session = await this.requireUserSession(request);
      return await this.paperService.endAccount(session.subjectId, accountId);
    } catch (error) {
      throw toHttpError(error);
    }
  }

  @Post("paper-accounts/:accountId/copies")
  async copyAccount(
    @Param("accountId") accountId: string,
    @Req() request: RequestLike,
    @Body() body: unknown,
  ) {
    const parsed = paperAccountCopySchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }

    try {
      const session = await this.requireUserSession(request);
      return await this.paperService.copyAccount(
        session.subjectId,
        accountId,
        parsed.data,
      );
    } catch (error) {
      throw toHttpError(error);
    }
  }

  @Delete("paper-accounts/:accountId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(
    @Param("accountId") accountId: string,
    @Req() request: RequestLike,
  ) {
    try {
      const session = await this.requireUserSession(request);
      await this.paperService.deleteAccount(session.subjectId, accountId);
    } catch (error) {
      throw toHttpError(error);
    }
  }

  @Post("paper-accounts/:accountId/execute-signal")
  async executeSignal(
    @Param("accountId") accountId: string,
    @Req() request: RequestLike,
    @Body() body: unknown,
  ) {
    const parsed = paperExecuteSignalSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }

    try {
      const session = await this.requireUserSession(request);
      return await this.paperService.executeSignal(
        session.subjectId,
        accountId,
        parsed.data,
      );
    } catch (error) {
      throw toHttpError(error);
    }
  }

  @Get("admin/paper-accounts")
  async listAdminAccounts(
    @Query() query: unknown,
    @Req() request: RequestLike,
  ) {
    await this.requireAdminSession(request);
    const parsed = listQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }
    return this.paperService.listAdminAccounts(parsed.data);
  }

  @Get("admin/paper-accounts/:accountId")
  async getAdminAccount(
    @Param("accountId") accountId: string,
    @Req() request: RequestLike,
  ) {
    await this.requireAdminSession(request);
    try {
      return await this.paperService.getAdminAccount(accountId);
    } catch (error) {
      throw toHttpError(error);
    }
  }

  @Post("admin/paper-accounts/:accountId/pause")
  async adminPauseAccount(
    @Param("accountId") accountId: string,
    @Body() body: unknown,
    @Req() request: RequestLike,
  ) {
    return this.runAdminAction(request, body, (input, context) =>
      this.paperService.adminPauseAccount(accountId, input, context),
    );
  }

  @Post("admin/paper-accounts/:accountId/resume")
  async adminResumeAccount(
    @Param("accountId") accountId: string,
    @Body() body: unknown,
    @Req() request: RequestLike,
  ) {
    return this.runAdminAction(request, body, (input, context) =>
      this.paperService.adminResumeAccount(accountId, input, context),
    );
  }

  @Post("admin/paper-accounts/:accountId/mark-abnormal")
  async adminMarkAbnormal(
    @Param("accountId") accountId: string,
    @Body() body: unknown,
    @Req() request: RequestLike,
  ) {
    return this.runAdminAction(request, body, (input, context) =>
      this.paperService.adminMarkAbnormal(accountId, input, context),
    );
  }

  private async runListSubResource<T>(
    request: RequestLike,
    accountId: string,
    query: unknown,
    handler: (
      session: Awaited<ReturnType<AuthService["validateSession"]>>,
      parsed: z.infer<typeof listQuerySchema>,
    ) => Promise<T>,
  ) {
    const parsed = listQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }

    try {
      const session = await this.requireUserSession(request);
      return await handler(session, parsed.data);
    } catch (error) {
      throw toHttpError(error);
    }
  }

  private async runAdminAction<T>(
    request: RequestLike,
    body: unknown,
    handler: (
      input: z.infer<typeof adminPaperAccountActionSchema>,
      context: ReturnType<typeof auditContext>,
    ) => Promise<T>,
  ) {
    const session = await this.requireAdminSession(request);
    const parsed = adminPaperAccountActionSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }

    try {
      return await handler(
        parsed.data,
        auditContext(request, session.subjectId, parsed.data.reason),
      );
    } catch (error) {
      throw toHttpError(error);
    }
  }

  private requireUserSession(request: RequestLike) {
    const token = readCookie(request, "qf_user_session");
    return this.authService.validateSession(token, "user");
  }

  private requireAdminSession(request: RequestLike) {
    const token = readCookie(request, "qf_admin_session");
    return this.authService.validateSession(token, "admin");
  }
}

function toHttpError(error: unknown) {
  if (error instanceof HttpException) {
    return error;
  }
  if (error instanceof PaperAccountNotFoundError) {
    return new HttpException(error.message, HttpStatus.NOT_FOUND);
  }
  if (
    error instanceof PaperAccountLimitError ||
    error instanceof PaperExecutionRejectedError
  ) {
    return new HttpException(error.message, HttpStatus.FORBIDDEN);
  }
  if (error instanceof PaperAccountInvalidStateError) {
    return new HttpException(error.message, HttpStatus.CONFLICT);
  }
  if (error instanceof PaperRiskNotAcceptedError) {
    return new HttpException(error.message, HttpStatus.UNPROCESSABLE_ENTITY);
  }
  if (error instanceof PaperMarketDataStaleError) {
    return new HttpException(error.message, HttpStatus.SERVICE_UNAVAILABLE);
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

function readCookie(request: RequestLike, name: string) {
  const header = request.headers.cookie;
  if (!header || typeof header !== "string") {
    return undefined;
  }

  return header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function headerValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

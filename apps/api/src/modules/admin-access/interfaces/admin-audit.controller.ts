import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
  Req,
} from "@nestjs/common";
import { z } from "zod";

import { AuthService } from "../../auth/application/auth.service.js";
import { AdminPermissionDeniedError } from "../domain/admin-access-errors.js";
import { ADMIN_PERMISSIONS } from "../domain/admin-permissions.js";
import { AdminAccessService } from "../application/admin-access.service.js";

type RequestLike = {
  headers: Record<string, string | string[] | undefined>;
};

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

@Controller()
export class AdminAuditController {
  constructor(
    private readonly authService: AuthService,
    private readonly adminAccessService: AdminAccessService,
  ) {}

  @Get("admin/audit-logs")
  async listAuditLogs(@Query() query: unknown, @Req() request: RequestLike) {
    const parsed = listQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }

    try {
      const session = await this.requireAdminWithPermission(
        request,
        ADMIN_PERMISSIONS.auditLogsRead,
      );
      void session;
      const result = await this.adminAccessService.listAuditLogs(
        parsed.data.page ?? 1,
        parsed.data.pageSize ?? 50,
      );
      return result;
    } catch (error) {
      throw toHttpError(error);
    }
  }

  private async requireAdminWithPermission(
    request: RequestLike,
    permission: (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS],
  ) {
    const token = readCookie(request, "qf_admin_session");
    const session = await this.authService.validateSession(token, "admin");
    await this.adminAccessService.assertPermission(
      session.subjectId,
      permission,
    );
    return session;
  }
}

function readCookie(request: RequestLike, name: string) {
  const header = request.headers.cookie;
  if (!header || typeof header !== "string") {
    return undefined;
  }

  const match = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!match) {
    return undefined;
  }

  return decodeURIComponent(match.slice(name.length + 1));
}

function toHttpError(error: unknown) {
  if (error instanceof HttpException) {
    return error;
  }
  if (error instanceof AdminPermissionDeniedError) {
    return new HttpException(
      { code: "FORBIDDEN", message: error.message },
      HttpStatus.FORBIDDEN,
    );
  }
  throw error;
}

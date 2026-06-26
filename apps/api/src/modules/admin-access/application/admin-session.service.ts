import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import { AuthService } from "../../auth/application/auth.service.js";
import type { AdminPermissionKey } from "../domain/admin-permissions.js";
import { AdminPermissionDeniedError } from "../domain/admin-access-errors.js";
import { AdminAccessService } from "./admin-access.service.js";

type RequestLike = {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
};

@Injectable()
export class AdminSessionService {
  constructor(
    private readonly authService: AuthService,
    private readonly adminAccessService: AdminAccessService,
  ) {}

  async requirePermission(
    request: RequestLike,
    permission: AdminPermissionKey,
  ) {
    const token = readCookie(request, "qf_admin_session");
    const session = await this.authService.validateSession(token, "admin");
    await this.adminAccessService.assertPermission(
      session.subjectId,
      permission,
    );
    return session;
  }

  auditContext(request: RequestLike, actorAdminId: string, reason: string) {
    return {
      actorAdminId,
      reason,
      ip: request.ip ?? headerValue(request.headers["x-forwarded-for"]),
      userAgent: headerValue(request.headers["user-agent"]),
    };
  }

  toHttpError(error: unknown) {
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

function headerValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

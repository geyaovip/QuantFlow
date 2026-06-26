import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
  Req,
} from "@nestjs/common";
import { z } from "zod";

import { AuthService } from "../application/auth.service.js";
import { AuthAccessDeniedError } from "../domain/auth-errors.js";

type RequestLike = {
  headers: Record<string, string | string[] | undefined>;
};

const listSecurityEventsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

@Controller()
export class MeController {
  constructor(private readonly authService: AuthService) {}

  @Get("me/security-events")
  async listSecurityEvents(
    @Query() query: unknown,
    @Req() request: RequestLike,
  ) {
    const parsed = listSecurityEventsQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }

    try {
      const session = await this.authService.validateSession(
        readCookie(request, "qf_user_session"),
        "user",
      );
      const page = parsed.data.page ?? 1;
      const pageSize = parsed.data.pageSize ?? 20;
      const result = await this.authService.listSecurityEvents(
        session.subjectId,
        page,
        pageSize,
      );

      return {
        data: result.items.map((item) => ({
          id: item.id,
          eventType: item.eventType,
          occurredAt: item.occurredAt.toISOString(),
          ip: item.ip,
        })),
        pagination: {
          page,
          pageSize,
          total: result.total,
          totalPages: Math.max(1, Math.ceil(result.total / pageSize)),
        },
      };
    } catch (error) {
      if (error instanceof AuthAccessDeniedError) {
        throw new HttpException(error.message, HttpStatus.FORBIDDEN);
      }
      throw error;
    }
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

  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

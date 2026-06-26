import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Query,
  Req,
} from "@nestjs/common";
import { z } from "zod";

import { notificationPreferenceUpdateSchema } from "@quantflow/contracts";

import { AuthService } from "../../auth/application/auth.service.js";
import { NotificationNotFoundError } from "../domain/notification-errors.js";
import { NotificationService } from "../application/notification.service.js";

type RequestLike = {
  headers: Record<string, string | string[] | undefined>;
};

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

@Controller()
export class NotificationController {
  constructor(
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
  ) {}

  @Get("notifications")
  async listNotifications(
    @Query() query: unknown,
    @Req() request: RequestLike,
  ) {
    const parsed = listQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const session = await this.requireUserSession(request);
    return this.notificationService.listNotifications(
      session.subjectId,
      parsed.data.page ?? 1,
      parsed.data.pageSize ?? 20,
    );
  }

  @Patch("notifications/:notificationId")
  async markNotificationRead(
    @Param("notificationId") notificationId: string,
    @Req() request: RequestLike,
  ) {
    try {
      const session = await this.requireUserSession(request);
      const data = await this.notificationService.markNotificationRead(
        session.subjectId,
        notificationId,
      );
      return { data };
    } catch (error) {
      throw toHttpError(error);
    }
  }

  @Get("notification-preferences")
  async listPreferences(@Req() request: RequestLike) {
    const session = await this.requireUserSession(request);
    const data = await this.notificationService.listPreferences(
      session.subjectId,
    );
    return { data };
  }

  @Patch("notification-preferences")
  async updatePreferences(@Body() body: unknown, @Req() request: RequestLike) {
    const parsed = notificationPreferenceUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const session = await this.requireUserSession(request);
    const data = await this.notificationService.updatePreferences(
      session.subjectId,
      parsed.data.preferences,
    );
    return { data };
  }

  private async requireUserSession(request: RequestLike) {
    const token = readCookie(request, "qf_user_session");
    return this.authService.validateSession(token, "user");
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
  if (error instanceof NotificationNotFoundError) {
    return new HttpException(
      { code: "RESOURCE_NOT_FOUND", message: error.message },
      HttpStatus.NOT_FOUND,
    );
  }
  throw error;
}

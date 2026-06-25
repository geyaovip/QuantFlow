import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
} from "@nestjs/common";

import {
  emailOtpRequestSchema,
  emailOtpVerifySchema,
} from "@quantflow/contracts";

import { AuthService } from "../application/auth.service.js";
import {
  AuthAccessDeniedError,
  AuthUnavailableError,
  InvalidOtpError,
} from "../domain/auth-errors.js";

type RequestLike = {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
};

type CookieResponse = {
  cookie(name: string, value: string, options: CookieOptions): void;
  clearCookie(
    name: string,
    options: Pick<CookieOptions, "path" | "sameSite">,
  ): void;
};

type CookieOptions = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  path: string;
  expires: Date;
};

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("email-otp/request")
  async requestEmailOtp(@Body() body: unknown, @Req() request: RequestLike) {
    const parsed = emailOtpRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }

    try {
      const result = await this.authService.requestEmailOtp(
        parsed.data.email,
        parsed.data.portal,
        {
          ip: request.ip,
          userAgent: headerValue(request.headers["user-agent"]),
          turnstileToken: parsed.data.turnstileToken,
        },
      );
      return { data: result };
    } catch (error) {
      throw toHttpError(error);
    }
  }

  @Post("email-otp/verify")
  async verifyEmailOtp(
    @Body() body: unknown,
    @Req() request: RequestLike,
    @Res({ passthrough: true }) response: CookieResponse,
  ) {
    const parsed = emailOtpVerifySchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }

    try {
      const session = await this.authService.verifyEmailOtp(
        parsed.data.email,
        parsed.data.portal,
        parsed.data.code,
        {
          ip: request.ip,
          userAgent: headerValue(request.headers["user-agent"]),
        },
      );
      response.cookie(cookieName(session.audience), session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: session.expiresAt,
      });
      return {
        data: {
          subjectId: session.subjectId,
          audience: session.audience,
          expiresAt: session.expiresAt.toISOString(),
        },
      };
    } catch (error) {
      throw toHttpError(error);
    }
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) response: CookieResponse) {
    response.clearCookie(cookieName("user"), { path: "/", sameSite: "lax" });
    response.clearCookie(cookieName("admin"), { path: "/", sameSite: "lax" });
    return { data: { message: "已退出登录" } };
  }
}

function cookieName(audience: "user" | "admin") {
  return audience === "admin" ? "qf_admin_session" : "qf_user_session";
}

function headerValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function toHttpError(error: unknown) {
  if (error instanceof InvalidOtpError) {
    return new HttpException(error.message, HttpStatus.UNAUTHORIZED);
  }
  if (error instanceof AuthAccessDeniedError) {
    return new HttpException(error.message, HttpStatus.FORBIDDEN);
  }
  if (error instanceof AuthUnavailableError) {
    return new HttpException(error.message, HttpStatus.SERVICE_UNAVAILABLE);
  }
  return new HttpException("服务暂时不可用", HttpStatus.INTERNAL_SERVER_ERROR);
}

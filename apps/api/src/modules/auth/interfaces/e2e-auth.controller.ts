import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  NotFoundException,
  Query,
} from "@nestjs/common";
import { z } from "zod";

import { loadAppConfig } from "../../../config/app-config.js";
import { AUTH_MAILER } from "../domain/auth-mailer.js";
import type { AuthMailer } from "../domain/auth-mailer.js";
import { FakeAuthMailer } from "../infrastructure/fake-auth-mailer.js";

const querySchema = z.object({
  email: z.email(),
});

@Controller("test/e2e")
export class E2eAuthController {
  constructor(@Inject(AUTH_MAILER) private readonly mailer: AuthMailer) {}

  @Get("last-otp")
  getLastOtp(@Query() query: unknown) {
    if (!loadAppConfig().enableE2eAuth) {
      throw new NotFoundException();
    }
    if (!(this.mailer instanceof FakeAuthMailer)) {
      throw new NotFoundException();
    }

    const parsed = querySchema.safeParse(query);
    if (!parsed.success) {
      throw new HttpException("请求参数有误", HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const match = [...this.mailer.sent]
      .reverse()
      .find(
        (entry) => entry.to.toLowerCase() === parsed.data.email.toLowerCase(),
      );

    if (!match) {
      throw new HttpException("验证码尚未生成", HttpStatus.NOT_FOUND);
    }

    return {
      data: {
        email: match.to,
        code: match.code,
      },
    };
  }
}

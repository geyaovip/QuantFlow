import { Module } from "@nestjs/common";

import { loadAppConfig } from "../../config/app-config.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { AuthService } from "./application/auth.service.js";
import { AUTH_CRYPTO } from "./domain/auth-crypto.js";
import { AUTH_MAILER } from "./domain/auth-mailer.js";
import { AUTH_REPOSITORY } from "./domain/auth-repository.js";
import { CLOCK, SystemClock } from "./domain/clock.js";
import { TURNSTILE_VERIFIER } from "./domain/turnstile-verifier.js";
import { CloudflareTurnstileVerifier } from "./infrastructure/cloudflare-turnstile-verifier.js";
import { FakeAuthMailer } from "./infrastructure/fake-auth-mailer.js";
import { NodeAuthCrypto } from "./infrastructure/node-auth-crypto.js";
import { NoopTurnstileVerifier } from "./infrastructure/noop-turnstile-verifier.js";
import { PrismaAuthRepository } from "./infrastructure/prisma-auth-repository.js";
import { ResendAuthMailer } from "./infrastructure/resend-auth-mailer.js";
import { AuthController } from "./interfaces/auth.controller.js";

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaAuthRepository,
    { provide: AUTH_REPOSITORY, useExisting: PrismaAuthRepository },
    { provide: CLOCK, useClass: SystemClock },
    {
      provide: AUTH_CRYPTO,
      useFactory: () => new NodeAuthCrypto(loadAppConfig().auth.otpPepper),
    },
    {
      provide: AUTH_MAILER,
      useFactory: () => {
        const config = loadAppConfig();
        return config.nodeEnv === "test"
          ? new FakeAuthMailer()
          : new ResendAuthMailer(
              config.auth.resendApiKey,
              config.auth.emailFrom,
            );
      },
    },
    {
      provide: TURNSTILE_VERIFIER,
      useFactory: () => {
        const config = loadAppConfig();
        return config.auth.turnstileSecretKey
          ? new CloudflareTurnstileVerifier(config.auth.turnstileSecretKey)
          : new NoopTurnstileVerifier();
      },
    },
  ],
})
export class AuthModule {}

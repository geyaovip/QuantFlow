import { Module, forwardRef } from "@nestjs/common";

import { AdminAccessModule } from "../admin-access/admin-access.module.js";
import { loadAppConfig } from "../../config/app-config.js";
import { MembershipModule } from "../membership/membership.module.js";
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
import { E2eAuthController } from "./interfaces/e2e-auth.controller.js";
import { MeController } from "./interfaces/me.controller.js";

const testAuthMailer = new FakeAuthMailer();

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => MembershipModule),
    forwardRef(() => AdminAccessModule),
  ],
  controllers: [AuthController, MeController, E2eAuthController],
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
          ? testAuthMailer
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
  exports: [AuthService],
})
export class AuthModule {}

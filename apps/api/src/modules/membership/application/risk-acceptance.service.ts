import { Injectable } from "@nestjs/common";

import type { RiskAcceptanceContext } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service.js";

export const RISK_DISCLOSURE_VERSION = "risk-v1";

@Injectable()
export class RiskAcceptanceService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    userId: string,
    context: RiskAcceptanceContext,
    disclosureVersion = RISK_DISCLOSURE_VERSION,
  ) {
    await this.prisma.userRiskAcceptance.upsert({
      where: {
        userId_disclosureVersion_context: {
          userId,
          disclosureVersion,
          context,
        },
      },
      create: { userId, disclosureVersion, context },
      update: { acceptedAt: new Date() },
    });
  }
}

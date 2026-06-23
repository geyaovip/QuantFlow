import { Controller, Get } from "@nestjs/common";

import { DEFAULT_FEATURE_FLAGS } from "@quantflow/contracts";

@Controller("system")
export class SystemController {
  @Get("feature-flags")
  getFeatureFlags() {
    return DEFAULT_FEATURE_FLAGS;
  }
}

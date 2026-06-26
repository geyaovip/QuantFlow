import { Controller, Get } from "@nestjs/common";

import { loadAppConfig } from "../../config/app-config.js";

@Controller("system")
export class SystemController {
  @Get("feature-flags")
  getFeatureFlags() {
    return loadAppConfig().featureFlags;
  }
}

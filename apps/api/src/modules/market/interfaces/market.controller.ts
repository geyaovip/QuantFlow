import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
} from "@nestjs/common";

import { MarketService } from "../application/market.service.js";

@Controller()
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get("market/symbols")
  listSymbols() {
    return this.marketService.listSymbols();
  }

  @Get("market/symbols/:symbol")
  async getSymbol(@Param("symbol") symbol: string) {
    const response = await this.marketService.getSymbol(symbol.toUpperCase());
    if (!response) {
      throw new HttpException("币种不存在", HttpStatus.NOT_FOUND);
    }
    return response;
  }
}

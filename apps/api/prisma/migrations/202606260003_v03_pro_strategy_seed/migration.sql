-- Seed one Pro-tier strategy so membership tier access can be verified in v0.3.
INSERT INTO "strategies" ("id", "slug", "name", "summary", "type", "risk_level", "status", "required_tier", "supports_paper_trading", "published_at", "created_at", "updated_at")
VALUES
  ('44444444-4444-4444-8444-444444444444', 'bnb-momentum', 'BNB 动量跟踪', '面向 Pro 会员的中短期动量观察策略，强调趋势延续与失效边界。', 'trend', 'high', 'active', 'pro', true, '2026-06-26T02:10:00Z', '2026-06-26T02:10:00Z', '2026-06-26T02:10:00Z')
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "strategy_versions" ("id", "strategy_id", "version", "symbols", "logic", "suitable_market", "unsuitable_market", "position_sizing", "stop_loss_logic", "take_profit_logic", "failure_modes", "data_source", "created_at")
VALUES
  ('44444444-4444-4444-8444-444444444445', '44444444-4444-4444-8444-444444444444', 1, ARRAY['BNBUSDT'], '结合动量强度与波动过滤，仅在延续性较强的行情中输出观察信号。', '趋势延续、成交活跃的行情。', '快速反转、流动性骤降或消息冲击阶段。', '单个模拟信号建议仓位不超过 8%，不使用杠杆。', '动量衰减或跌破失效阈值时停止观察。', '达到目标区间或动能明显减弱时止盈观察。', '突发行情和假突破可能导致信号失效。', 'platform_seed_v1', '2026-06-26T02:10:00Z')
ON CONFLICT ("strategy_id", "version") DO NOTHING;

INSERT INTO "strategy_metrics" ("id", "strategy_id", "strategy_version_id", "period", "return_rate", "max_drawdown", "win_rate", "profit_loss_ratio", "trade_count", "sample_size", "data_source", "calculated_at")
VALUES
  ('44444444-4444-4444-8444-444444444446', '44444444-4444-4444-8444-444444444444', '44444444-4444-4444-8444-444444444445', 'ninety_days', 0.15400000, -0.08200000, 0.55600000, 1.52000000, 48, 48, 'platform_seed_v1', '2026-06-26T02:10:00Z')
ON CONFLICT ("strategy_version_id", "period", "data_source", "calculated_at") DO NOTHING;

INSERT INTO "strategy_signals" ("id", "strategy_id", "strategy_version_id", "symbol", "direction", "trigger_price", "current_price_snapshot", "suggested_position_pct", "stop_loss_price", "take_profit_price", "rationale", "status", "risk_level", "generated_at", "valid_until", "created_at", "updated_at")
VALUES
  ('44444444-4444-4444-8444-444444444447', '44444444-4444-4444-8444-444444444444', '44444444-4444-4444-8444-444444444445', 'BNBUSDT', 'watch', 612.00000000, 618.50000000, 0.08000000, 582.00000000, 655.00000000, '动量延续仍在观察区间，尚未触发失效条件。该信号仅用于模拟验证。', 'active', 'high', '2026-06-26T02:10:00Z', '2026-06-27T02:10:00Z', '2026-06-26T02:10:00Z', '2026-06-26T02:10:00Z')
ON CONFLICT ("id") DO NOTHING;

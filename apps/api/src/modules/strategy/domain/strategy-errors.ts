export class StrategyNotFoundError extends Error {
  constructor() {
    super("策略不存在或不可见");
  }
}

export class SignalNotFoundError extends Error {
  constructor() {
    super("信号不存在或不可见");
  }
}

export class StrategySubscriptionLimitError extends Error {
  constructor() {
    super("当前会员等级的策略订阅数量已达上限");
  }
}

export class StrategyTierAccessError extends Error {
  readonly requiredTier: string;

  constructor(requiredTier: string) {
    super("当前会员计划无法访问该策略，请升级后查看");
    this.name = "StrategyTierAccessError";
    this.requiredTier = requiredTier;
  }
}

export class StrategyRiskNotAcceptedError extends Error {
  constructor() {
    super("请先确认风险提示");
    this.name = "StrategyRiskNotAcceptedError";
  }
}

export class StrategyInvalidStateError extends Error {
  constructor(message = "当前策略状态不允许执行该操作") {
    super(message);
  }
}

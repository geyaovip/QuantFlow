export class PaperAccountNotFoundError extends Error {
  constructor() {
    super("模拟盘不存在或不可见");
  }
}

export class PaperAccountLimitError extends Error {
  constructor() {
    super("当前会员等级的活跃模拟盘数量已达上限");
  }
}

export class PaperAccountInvalidStateError extends Error {
  constructor(message = "当前模拟盘状态不允许执行该操作") {
    super(message);
  }
}

export class PaperExecutionRejectedError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class PaperRiskNotAcceptedError extends Error {
  constructor() {
    super("请先确认风险提示");
  }
}

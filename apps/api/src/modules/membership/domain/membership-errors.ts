export class MembershipPlanNotFoundError extends Error {
  constructor() {
    super("membership plan not found");
    this.name = "MembershipPlanNotFoundError";
  }
}

export class MembershipCheckoutNotAllowedError extends Error {
  constructor() {
    super("membership checkout not allowed");
    this.name = "MembershipCheckoutNotAllowedError";
  }
}

export class MembershipRiskNotAcceptedError extends Error {
  constructor() {
    super("membership risk not accepted");
    this.name = "MembershipRiskNotAcceptedError";
  }
}

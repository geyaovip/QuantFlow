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

export class MembershipPaymentDisabledError extends Error {
  constructor() {
    super("membership production payment is disabled");
    this.name = "MembershipPaymentDisabledError";
  }
}

export class MembershipPaymentCreateError extends Error {
  constructor() {
    super("membership payment create failed");
    this.name = "MembershipPaymentCreateError";
  }
}

export class MembershipPaymentCallbackInvalidError extends Error {
  constructor() {
    super("membership payment callback invalid");
    this.name = "MembershipPaymentCallbackInvalidError";
  }
}

export class MembershipRiskNotAcceptedError extends Error {
  constructor() {
    super("membership risk not accepted");
    this.name = "MembershipRiskNotAcceptedError";
  }
}

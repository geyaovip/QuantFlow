import { describe, expect, it } from "vitest";

import {
  DEFAULT_FEATURE_FLAGS,
  emailOtpRequestSchema,
  emailOtpVerifySchema,
} from "./index";

describe("contracts", () => {
  it("keeps all future trading capabilities disabled", () => {
    expect(Object.values(DEFAULT_FEATURE_FLAGS).every((value) => !value)).toBe(
      true,
    );
  });

  it("accepts a valid user OTP request", () => {
    expect(
      emailOtpRequestSchema.parse({
        email: "user@example.com",
        portal: "user",
      }),
    ).toEqual({ email: "user@example.com", portal: "user" });
  });

  it("requires a six digit OTP code", () => {
    expect(
      emailOtpVerifySchema.parse({
        email: "user@example.com",
        portal: "user",
        code: "123456",
      }),
    ).toEqual({
      email: "user@example.com",
      portal: "user",
      code: "123456",
    });
    expect(() =>
      emailOtpVerifySchema.parse({
        email: "user@example.com",
        portal: "user",
        code: "12345",
      }),
    ).toThrow();
  });
});

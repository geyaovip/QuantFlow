import { expect, test } from "@playwright/test";

import { loginWithEmailOtp } from "../helpers/auth.js";

test.describe("User journey web", () => {
  test("authenticated user can open strategy and paper trading workspaces", async ({
    page,
  }) => {
    await loginWithEmailOtp(page.request);

    const startedAt = Date.now();
    await page.goto("/app/strategies");
    await expect(
      page.getByRole("heading", { name: "发现可跟踪的策略" }),
    ).toBeVisible();
    expect(Date.now() - startedAt).toBeLessThan(3000);
    await expect(
      page.getByText("最大回撤", { exact: false }).first(),
    ).toBeVisible();

    await page.goto("/app/paper-trading");
    await expect(page.getByRole("heading", { name: "模拟盘" })).toBeVisible();
    await expect(
      page.getByText("模拟", { exact: false }).first(),
    ).toBeVisible();

    await page.goto("/app/signals");
    await expect(page.getByRole("heading", { name: "信号中心" })).toBeVisible();
    await expect(page.getByText("待接入", { exact: false })).toHaveCount(0);
  });
});

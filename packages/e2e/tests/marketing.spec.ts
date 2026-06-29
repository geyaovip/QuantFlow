import { expect, test } from "@playwright/test";

test.describe("Marketing website", () => {
  test("homepage exposes brand, CTA and risk disclosure", async ({ page }) => {
    const startedAt = Date.now();
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    expect(Date.now() - startedAt).toBeLessThan(3000);
    await expect(page).toHaveTitle(/QuantFlow/i);
    await expect(
      page.getByRole("banner").getByRole("link", { name: "进入应用" }),
    ).toBeVisible();
    await expect(
      page.locator("#risk-disclosure").getByText("QuantFlow 不提供投资建议", {
        exact: false,
      }),
    ).toBeVisible();
  });

  test("app workspace redirects unauthenticated users to login", async ({
    page,
  }) => {
    await page.goto("/app/strategies");
    await expect(page).toHaveURL(/\/login/);
  });
});

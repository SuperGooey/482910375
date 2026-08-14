import { test, expect, type Page } from "@playwright/test";
import { APP_PATH } from "./constants";

// Regression coverage for two previously-fixed bugs called out in
// src/App.tsx: the desktop/mobile breakpoint must be exactly 1024px, and
// resizing an open call's window across it must not reset the call's clock,
// transcript, or confirmation state (useCallDetailState is lifted above the
// mobile/desktop shell swap specifically so this doesn't unmount/remount).

async function readClockSeconds(page: Page): Promise<number> {
  const text = await page.getByText(/\d{2}:\d{2} · 5th & Main/).textContent();
  const m = text!.match(/(\d{2}):(\d{2})/);
  return parseInt(m![1], 10) * 60 + parseInt(m![2], 10);
}

test.describe("responsive breakpoint", () => {
  test("the desktop breakpoint is exactly 1024px, matching Tailwind's lg:", async ({ page }) => {
    await page.setViewportSize({ width: 1023, height: 900 });
    await page.goto(APP_PATH);

    // 1023px: still the mobile single-pane shell
    await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Queue" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Jobs" })).toBeVisible();

    // crossing to exactly 1024px flips to the desktop split-pane shell,
    // reactively (useMediaQuery via matchMedia), without a reload
    await page.setViewportSize({ width: 1024, height: 900 });
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  });

  test("resizing an open call across the breakpoint preserves its clock, transcript, and confirmation state", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto(APP_PATH);

    await page.getByRole("button", { name: /No hot water — water heater/ }).click();

    // let a couple of script lines reveal and the clock tick a few times
    // past the call's startSeconds (58s) before capturing a baseline
    await expect(page.getByText("checked the breaker", { exact: false })).toBeVisible();
    const secondsBeforeResize = await readClockSeconds(page);
    expect(secondsBeforeResize).toBeGreaterThan(58);

    // cross the breakpoint mid-call: mobile -> desktop
    await page.setViewportSize({ width: 1440, height: 900 });

    // now the desktop panel (close-X, no tab switcher, still docked)
    await expect(page.getByRole("button", { name: "Close" })).toBeVisible();
    await expect(page.getByRole("tablist", { name: "Call detail sections" })).toHaveCount(0);

    // transcript state carried over — no reset back to just the first line
    await expect(page.getByText("checked the breaker", { exact: false })).toBeVisible();
    const secondsAfterFirstResize = await readClockSeconds(page);
    expect(secondsAfterFirstResize).toBeGreaterThanOrEqual(secondsBeforeResize);

    // and back again: desktop -> mobile
    await page.setViewportSize({ width: 393, height: 852 });
    await expect(page.getByRole("button", { name: "Back" })).toBeVisible();
    await expect(page.getByText("checked the breaker", { exact: false })).toBeVisible();
    const secondsAfterSecondResize = await readClockSeconds(page);
    expect(secondsAfterSecondResize).toBeGreaterThanOrEqual(secondsAfterFirstResize);

    // let the call finish auto-confirming (AI dispatch mode, the default)
    const statusButton = page.getByRole("status");
    await expect(statusButton).toHaveText(/Dispatched — View job/, { timeout: 20_000 });

    // resize again post-confirmation: the confirmed state must survive too,
    // not revert to "Confirming…"
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(statusButton).toHaveText(/Dispatched — View job/);

    // and the flow still works from here: the resulting case is docked in
    // the panel (its unit renders once there, and again in the list card)
    await statusButton.click();
    await expect(page.getByRole("button", { name: "Close" })).toBeVisible();
    await expect(page.getByText("Tech · M. Alvarez")).toHaveCount(2);
  });
});

import { test, expect } from "@playwright/test";
import { APP_PATH } from "./constants";

// Mobile shell (< 1024px): single pane, bottom tab bar, full-screen push
// navigation into call/case detail. See src/shell/MobileShell.tsx and
// src/features/call-detail/CallDetail.tsx's variant="fullscreen".

test.describe("mobile shell", () => {
  test("renders the live queue behind a bottom tab bar, with no desktop chrome", async ({ page }) => {
    await page.goto(APP_PATH);

    await expect(page.getByText("Live queue", { exact: true })).toBeVisible();
    await expect(page.getByText("4 active")).toBeVisible();

    // bottom tab bar (mobile-only nav)
    await expect(page.getByRole("button", { name: "Queue" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Jobs" })).toBeVisible();

    // real mock call cards render
    await expect(page.getByRole("button", { name: /No hot water — water heater/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Gas smell near furnace/ })).toBeVisible();

    // desktop-only chrome (sidebar) must not exist below the breakpoint
    await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(0);
  });

  test("opening a call plays the transcript, advances the plan, and auto-confirms into a job", async ({ page }) => {
    await page.goto(APP_PATH);

    await page.getByRole("button", { name: /No hot water — water heater/ }).click();

    // full-screen call detail: back chevron (not the panel's close-X)
    await expect(page.getByRole("button", { name: "Back" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Close" })).toHaveCount(0);

    // opens on the "Call" tab (transcript) by default
    await expect(page.getByRole("tablist", { name: "Call detail sections" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Call" })).toHaveAttribute("aria-selected", "true");

    // the scripted transcript plays out over several seconds
    await expect(page.getByText("no hot water at all", { exact: false })).toBeVisible();
    await expect(page.getByText("checked the breaker", { exact: false })).toBeVisible();

    // Team tab: ranked technician list instead of the transcript
    await page.getByRole("tab", { name: "Team" }).click();
    await expect(page.getByText("Tech · M. Alvarez")).toBeVisible();
    await expect(page.getByText("Tech · J. Diaz")).toBeVisible();

    // Context tab: caller info + surfaced context items
    await page.getByRole("tab", { name: "Context" }).click();
    await expect(page.getByText("Service history")).toBeVisible();

    // back to the transcript and let it play out to completion
    await page.getByRole("tab", { name: "Call" }).click();

    // AI dispatch mode (the default) auto-confirms once the plan reaches the
    // "scheduling" phase — asserted via the resulting status button.
    // Generous timeout: the scripted transcript takes ~12s to fully play out
    // at real timing (see MESSAGE_ADVANCE_DELAY_MS / AUTO_CONFIRM_DELAY_MS).
    const statusButton = page.getByRole("status");
    await expect(statusButton).toHaveText(/Dispatched — View job/, { timeout: 20_000 });

    await statusButton.click();

    // full-screen case detail for the resulting job
    await expect(page.getByRole("button", { name: "Back" })).toBeVisible();
    await expect(page.getByText("En route")).toBeVisible();
    await expect(page.getByText("Tech · M. Alvarez").first()).toBeVisible();

    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.getByText("Live queue", { exact: true })).toBeVisible();
  });

  test("Missed and History sub-views show real mock data", async ({ page }) => {
    await page.goto(APP_PATH);

    await page.getByRole("tab", { name: "Missed" }).click();
    await expect(page.getByText("2 missed")).toBeVisible();
    await expect(page.getByText("Marcus Webb")).toBeVisible();
    await expect(page.getByText("Unknown — no answer")).toBeVisible();

    await page.getByRole("tab", { name: "History" }).click();
    await expect(page.getByText("3 in history")).toBeVisible();
    await expect(page.getByText("AC tune-up request")).toBeVisible();
    await expect(page.getByText(/Booked a seasonal AC tune-up/)).toBeVisible();
  });

  test("Jobs tab shows In progress / Scheduled / Resolved, including the scrolling timeline board", async ({ page }) => {
    await page.goto(APP_PATH);

    await page.getByRole("button", { name: "Jobs" }).click();
    await expect(page.getByText("4 in progress")).toBeVisible();
    await expect(page.getByRole("tab", { name: "In progress" })).toHaveAttribute("aria-selected", "true");

    await page.getByRole("tab", { name: "Resolved" }).click();
    await expect(page.getByText(/Replaced water heater heating element/)).toBeVisible();

    await page.getByRole("tab", { name: "Scheduled" }).click();

    // the timeline board scrolls horizontally
    const viewport = page.locator(".overflow-x-auto").first();
    await expect(viewport).toBeVisible();
    await expect(async () => {
      const scrollable = await viewport.evaluate((el) => el.scrollWidth > el.clientWidth);
      expect(scrollable).toBe(true);
    }).toPass();

    // zoom all the way in so job blocks are wide enough to show their labels
    const zoomIn = page.getByRole("button", { name: "Zoom in (show more detail)" });
    for (let i = 0; i < 6; i++) await zoomIn.click();
    await expect(page.getByRole("slider", { name: "Timeline zoom level" })).toHaveAttribute(
      "aria-valuetext",
      "One hour visible"
    );

    // opening a job from the board pushes full-screen case detail (Playwright
    // scrolls the horizontally-scrolling board to bring it into view first)
    await page.getByText("Maple Dr").click();
    await expect(page.getByRole("button", { name: "Back" })).toBeVisible();
    await expect(page.getByText("Tech · J. Alvarez")).toBeVisible();
    await expect(page.getByText("Tomorrow · 10:00 AM")).toBeVisible();
  });
});

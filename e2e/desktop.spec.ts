import { test, expect, type Locator, type Page } from "@playwright/test";
import { APP_PATH } from "./constants";

// Desktop shell (>= 1024px): sidebar + list pane + a docked, elevated detail
// panel. See src/shell/DesktopShell.tsx, src/shell/DetailPane.tsx, and
// src/features/call-detail/CallDetail.tsx's variant="panel" (Team/Call/
// Context as three simultaneous columns, no tabs).

// The "active" look for a list card is an inset box-shadow whose width goes
// from 1px (resting) to 2px (selected) — see MapCard's `active` prop and
// SquircleCard's border overlay (always the last <div> under the card).
async function isHighlighted(card: Locator): Promise<boolean> {
  const overlay = card.locator("div").last();
  const boxShadow = await overlay.evaluate((el) => getComputedStyle(el).boxShadow);
  return boxShadow.includes("2px");
}

async function openQueueCall(page: Page, name: RegExp) {
  await page.getByRole("button", { name }).click();
}

test.describe("desktop shell", () => {
  test("renders sidebar, list pane, and an empty detail panel at rest", async ({ page }) => {
    await page.goto(APP_PATH);

    const sidebar = page.getByRole("navigation", { name: "Primary" });
    await expect(sidebar).toBeVisible();
    await expect(page.getByRole("button", { name: "Queue" })).toHaveAttribute("aria-current", "page");

    await expect(page.getByText("Live queue", { exact: true })).toBeVisible();
    await expect(page.getByText("4 active")).toBeVisible();
    await expect(page.getByRole("tab", { name: "Live" })).toHaveAttribute("aria-selected", "true");

    await expect(page.getByText("Select a call or job to see details here.")).toBeVisible();
  });

  test("selecting a queue call highlights it in the list and docks Team/Call/Context simultaneously", async ({
    page,
  }) => {
    await page.goto(APP_PATH);

    const card = page.getByRole("button", { name: /No hot water — water heater/ });
    await expect(await isHighlighted(card)).toBe(false);

    await card.click();
    await expect(async () => expect(await isHighlighted(card)).toBe(true)).toPass();

    // panel mode has no tab switcher — everything shows at once
    await expect(page.getByRole("tablist", { name: "Call detail sections" })).toHaveCount(0);

    // Team, Call (transcript), and Context are all visible simultaneously,
    // with nothing clicked to switch between them
    await expect(page.getByText("Tech · M. Alvarez")).toBeVisible();
    await expect(page.getByText("Tech · J. Diaz")).toBeVisible();
    await expect(page.getByText("no hot water at all", { exact: false })).toBeVisible();
    await expect(page.getByText("Service history")).toBeVisible();
  });

  test("technician picker opens confined to the panel and reassigning updates the plan", async ({ page }) => {
    await page.goto(APP_PATH);
    await openQueueCall(page, /No hot water — water heater/);

    // manual takeover disables auto-confirm so the assignment button stays
    // put (otherwise AI mode confirms ~700ms after it first appears, racing
    // this test)
    await page.getByRole("radio", { name: "Manual takeover" }).click();

    const assignButton = page.getByRole("button", { name: /Assigned: Tech · M\. Alvarez/ });
    await expect(assignButton).toBeVisible({ timeout: 20_000 });
    await assignButton.click();

    const dialog = page.getByRole("dialog", { name: "Choose technician" });
    await expect(dialog).toBeVisible();

    // confined to the detail panel: sidebar (96px) + list pane (400px) sit
    // to its left, so the dialog should never render further left than that
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(480);

    await dialog.getByText("Tech · J. Diaz").click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Assigned: Tech · J\. Diaz/ })).toBeVisible();
  });

  test("confirming a call and clicking View job switches the sidebar to Jobs and keeps the case docked", async ({
    page,
  }) => {
    await page.goto(APP_PATH);
    await openQueueCall(page, /No hot water — water heater/);

    const statusButton = page.getByRole("status");
    await expect(statusButton).toHaveText(/Dispatched — View job/, { timeout: 20_000 });
    await statusButton.click();

    // sidebar follows the new job into the Jobs tab
    await expect(page.getByRole("button", { name: "Jobs" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("tab", { name: "In progress" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText("4 in progress")).toBeVisible();

    // the new case is highlighted in the list...
    const caseCard = page.getByRole("button", { name: /5th & Main/ });
    await expect(async () => expect(await isHighlighted(caseCard)).toBe(true)).toPass();

    // ...while still docked in the panel (same unit text rendered twice:
    // once in the list card, once in the panel)
    await expect(page.getByRole("button", { name: "Close" })).toBeVisible();
    await expect(page.getByText("Tech · M. Alvarez")).toHaveCount(2);
  });

  test("switching sub-views clears the detail panel instead of leaving the previous selection stale", async ({
    page,
  }) => {
    await page.goto(APP_PATH);
    await openQueueCall(page, /No hot water — water heater/);

    // docked: the call's situation renders in the list card, again in the
    // panel's top strip, and again in the panel's plan card
    await expect(page.getByText("No hot water — water heater")).toHaveCount(3);
    await expect(page.getByRole("button", { name: "Close" })).toBeVisible();

    await page.getByRole("tab", { name: "Missed" }).click();

    await expect(page.getByText("Select a call or job to see details here.")).toBeVisible();
    await expect(page.getByText("No hot water — water heater")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Close" })).toHaveCount(0);
  });
});

import { test } from "@e2e-dev/web";
import { expect } from "e2e";

test("Ctrl+K opens UI SDK command search without altering catalog query", async ({
  app,
  browser,
  screen,
}) => {
  await app.open("/Registry-Atlas/components");
  const catalog = screen.getByRole("searchbox", "Search catalog");
  await catalog.fill("button");
  const before = await browser.evaluate(() => location.search);

  await catalog.press("Control+k");
  await expect(screen.getByRole("combobox", "Search commands")).toBeFocused();
  expect(await browser.evaluate(() => location.search)).toBe(before);

  await screen.getByRole("combobox", "Search commands").press("Escape");
  await expect(screen.getByRole("dialog", "Search Registry Atlas")).not.toBeVisible();
});

test("palette navigates to a source-backed catalog destination", async ({
  app,
  browser,
  screen,
}) => {
  await app.open("/Registry-Atlas/components");
  await screen.getByRole("button", "Open command palette").tap();
  await screen.getByRole("combobox", "Search commands").fill("Libraries");
  await screen.getByRole("combobox", "Search commands").press("ArrowDown");
  await screen.getByRole("combobox", "Search commands").press("ArrowUp");
  await screen.getByRole("combobox", "Search commands").press("Enter");
  await expect(browser).toHaveURL("/Registry-Atlas/registries");
});

test("nested component groups support drill-in and back navigation", async ({ app, screen }) => {
  await app.open("/Registry-Atlas/components");
  await screen.getByRole("button", "Open command palette").tap();
  await screen.getByRole("option", "Controls").tap();
  await expect(screen.getByRole("option", "All Controls")).toBeVisible();
  await screen.getByRole("combobox", "Search commands").press("Backspace");
  await expect(screen.getByRole("option", "Controls")).toBeVisible();
});

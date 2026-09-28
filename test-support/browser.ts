import { chromium, type Page } from "playwright-core";

export async function withBrowserPage(
  fixture: URL,
  verify: (page: Page) => Promise<void>,
): Promise<void> {
  const browser = await chromium.launch({
    headless: true,
    args: ["--allow-file-access-from-files"],
  });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(5000);
    const errors: Error[] = [];
    page.on("pageerror", error => errors.push(error));
    await page.goto(fixture.href);
    await verify(page);
    if (errors.length) throw new AggregateError(errors, "Browser fixture raised page errors");
  } finally {
    await browser.close();
  }
}

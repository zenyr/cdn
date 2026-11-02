import { expect, test } from "bun:test";
import { withBrowserPage } from "./test-support/browser";

test("Mermaid renders Korean diagrams, preserves failures and follows themes", async () => {
  await withBrowserPage(new URL("./examples/mermaid-test.html", import.meta.url), async page => {
    await page.locator("[data-mermaid-error]").waitFor();
    expect(await page.locator(".report-mermaid-canvas svg").count()).toBe(2);
    expect(await page.locator(".report-mermaid-canvas").first().textContent()).toContain("브라우저");
    expect(await page.locator(".report-mermaid-canvas").nth(1).textContent()).toContain("사용자");
    expect(await page.locator("[data-mermaid-error] details[open]").textContent()).toContain("not-a-diagram");
    expect(await page.getByText("한글 본문 유지", { exact: true }).count()).toBe(1);
    expect(await page.locator("code.language-js .hljs-keyword").textContent()).toBe("const");
    const inspect = () => page.locator(".report-mermaid-figure").first().evaluate(element => ({
      color: getComputedStyle(element).getPropertyValue("--pele-fg").trim(),
      font: getComputedStyle(element).getPropertyValue("--pele-font").trim(),
      width: element.getBoundingClientRect().width,
    }));
    await page.evaluate(() => document.documentElement.dataset.mantineColorScheme = "light");
    const light = await inspect();
    await page.evaluate(() => document.documentElement.dataset.mantineColorScheme = "dark");
    expect((await inspect()).color).not.toBe(light.color);
    expect(light.font).toContain("IBM Plex Sans KR");
    await page.setViewportSize({ width: 375, height: 800 });
    expect((await inspect()).width).toBeLessThanOrEqual(375);
    await page.emulateMedia({ media: "print" });
    expect((await inspect()).color).toBe("#000");
    expect(await page.locator("[data-mermaid-error] details").isVisible()).toBe(true);
    const ids = await page.locator(".report-mermaid-canvas [id]").evaluateAll(elements => elements.map(element => element.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(await page.locator(".report-mermaid-canvas script, .report-mermaid-canvas foreignObject").count()).toBe(0);
  });
}, 15_000);


test("Mermaid loads once on demand and keeps source when loading fails", async () => {
  await withBrowserPage(new URL("./examples/svg-namespace-test.html", import.meta.url), async page => {
    const requests: string[] = [];
    page.on("request", request => {
      if (request.url().endsWith("report-mermaid-renderer.esm.js")) requests.push(request.url());
    });
    await page.reload();
    await page.locator("body[data-svg-namespace]").waitFor();
    expect(requests).toHaveLength(0);
    await page.goto(new URL("./examples/mermaid-test.html", import.meta.url).href);
    await page.locator("[data-mermaid-error]").waitFor();
    expect(requests).toHaveLength(1);

    await page.route("**/report-mermaid-renderer.esm.js", async route => {
      await page.locator(".report-mermaid-figure details[open]").first().waitFor();
      expect(await page.locator('.report-mermaid-figure[aria-busy="true"]').count()).toBe(3);
      await route.abort();
    });
    await page.reload();
    await page.locator("[data-mermaid-error]").nth(2).waitFor();
    expect(await page.locator(".report-mermaid-canvas svg").count()).toBe(0);
    expect(await page.locator("[data-mermaid-error] details[open]").count()).toBe(3);
    expect(await page.getByText("한글 본문 유지", { exact: true }).count()).toBe(1);
  });
}, 15_000);

import { expect, test } from "bun:test";
import { withBrowserPage } from "./test-support/browser";
import type { Page } from "playwright-core";

const fixture = new URL("./examples/mdxcn-test.html", import.meta.url);

const withMdxcnPage = (url: URL, verify: (page: Page) => Promise<void>) =>
  withBrowserPage(url, verify, async page => {
    await page.route('https://cdn.jsdelivr.net/gh/zenyr/cdn@*/dist/**', async route => {
      const asset = new URL(route.request().url()).pathname.split('/dist/')[1];
      await route.fulfill({
        path: `${import.meta.dir}/dist/${asset}`,
        headers: { 'access-control-allow-origin': '*' },
      });
    });
  });

test("all mdxcn components render Markdown, tables and data children", async () => {
  await withMdxcnPage(fixture, async page => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator('[data-frame]').nth(75).waitFor();
    await page.waitForFunction(() => !document.querySelector('[data-mdxcn-loading], [data-mdxcn-error]'));
    expect(await page.locator('[data-frame]').count()).toBe(76);
    expect(await page.locator('[data-mdxcn-error]').count()).toBe(0);
    expect(await page.locator('[data-frame]').evaluateAll(figures => figures.every(figure => (figure.textContent?.trim().length ?? 0) > 5))).toBe(true);
    const tables = page.locator('[data-frame]').filter({ hasText: 'WHAT THE RESEARCH COST' });
    expect(await tables.innerText()).toContain('437,141');
    expect(await page.locator('[data-frame]').filter({ hasText: '[ LAUNCH ]' }).first().innerText()).toContain('2 of 3 done');
    expect(await page.getByText('설정 확인', { exact: true }).count()).toBe(1);
    expect(await page.getByText('새 버전 적용', { exact: true }).count()).toBe(1);
    expect(await page.locator('[data-frame]').filter({ hasText: '태그 표' }).innerText()).toContain('전체');
    expect(await page.getByText('한글 안내', { exact: false }).count()).toBeGreaterThan(0);
    expect(await page.locator('[data-frame]').first().evaluate(element => getComputedStyle(element).backgroundImage)).toContain('repeating-linear-gradient');
    expect(await page.locator('[data-frame]').filter({ hasText: 'November 2026' }).locator('.grid-cols-7').first().innerText()).toMatch(/^M/);
    expect(await page.locator('[data-frame]').filter({ hasText: 'November 2026' }).innerText()).toContain('[17]');
    const missing = await page.evaluate(async () => {
      const script = document.querySelector<HTMLScriptElement>('script[src]')!;
      const renderer = await import(new URL('./report-mdxcn-renderer.esm.js', script.src).href);
      return Object.keys(renderer.mdxcnComponents).filter(name => !Object.hasOwn((window as any).Zenyr.report.defaultComponents, name));
    });
    expect(missing).toEqual([]);
    const light = await page.locator('[data-frame]').first().evaluate(element => getComputedStyle(element).color);
    await page.evaluate(() => document.documentElement.dataset.mantineColorScheme = 'dark');
    const dark = await page.locator('[data-frame]').first().evaluate(element => getComputedStyle(element).color);
    expect(dark).not.toBe(light);
    await page.emulateMedia({ media: 'print' });
    expect(await page.locator('[data-frame]').first().evaluate(element => getComputedStyle(element).getPropertyValue('--graph-accent').trim())).toBe('#000');
    expect(await page.locator('[data-frame]').last().evaluate(element => getComputedStyle(element).opacity)).toBe('1');
  });
}, 20_000);

test("mdxcn loads on demand once and keeps prose during loading and failure", async () => {
  await withMdxcnPage(new URL("./examples/code-highlight-test.html", import.meta.url), async page => {
    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().endsWith('report-mdxcn-renderer.esm.js')) requests.push(request.url());
    });
    await page.reload();
    await page.locator('.report-document').waitFor();
    expect(requests).toHaveLength(0);
    await page.goto(fixture.href);
    await page.locator('[data-frame]').nth(75).waitFor();
    expect(requests).toHaveLength(1);
    await page.route('**/report-mdxcn-renderer.esm.js', async route => {
      await page.locator('[data-mdxcn-loading]').first().waitFor();
      expect(await page.getByText('본문은 MDX 한 번만 작성합니다.', { exact: true }).count()).toBe(1);
      expect(await page.locator('[data-mdxcn-loading] table').count()).toBeGreaterThan(0);
      await route.abort();
    });
    await page.reload();
    await page.locator('[data-mdxcn-error]').first().waitFor();
    expect(await page.getByText('본문은 MDX 한 번만 작성합니다.', { exact: true }).count()).toBe(1);
    expect(await page.locator('[data-mdxcn-error] table').count()).toBeGreaterThan(0);
    expect(await page.locator('[data-mdxcn-error] [data-mdxcn-loading]').count()).toBe(0);
    expect(await page.getByText('설정 확인', { exact: false }).count()).toBeGreaterThan(0);
  });
}, 20_000);

test("a malformed component preserves its block and surrounding prose", async () => {
  await withMdxcnPage(fixture, async page => {
    await page.locator('[data-frame]').nth(75).waitFor();
    await page.evaluate(() => {
      const root = document.createElement('div');
      const source = document.createElement('script');
      source.type = 'text/mdx';
      source.textContent = '주변 본문 유지\n\n<GraphTable rows="invalid">\n\n원래 블록 유지\n\n</GraphTable>';
      document.body.append(root, source);
      (window as any).Zenyr.report.mountDocument({ root, source });
    });
    await page.locator('[data-mdxcn-error="GraphTable"]').waitFor();
    expect(await page.getByText('주변 본문 유지', { exact: true }).count()).toBe(1);
    expect(await page.locator('[data-mdxcn-error="GraphTable"]').innerText()).toContain('원래 블록 유지');
    expect(await page.locator('[data-frame]').count()).toBe(76);
  });
}, 15_000);

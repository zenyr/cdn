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
    await page.locator('[data-frame]').nth(88).waitFor();
    await page.waitForFunction(() => !document.querySelector('[data-mdxcn-loading], [data-mdxcn-error]'));
    expect(await page.locator('[data-frame]').count()).toBe(89);
    expect(await page.locator('[data-mdxcn-error]').count()).toBe(0);
    expect(await page.locator('[data-frame]').evaluateAll(figures => figures.every(figure => (figure.textContent?.trim().length ?? 0) > 5))).toBe(true);
    const tables = page.locator('[data-frame]').filter({ hasText: 'WHAT THE RESEARCH COST' });
    expect(await tables.innerText()).toContain('437,141');
    expect(await tables.locator('tbody td').first().evaluate(element => {
      const style = getComputedStyle(element);
      return { left: style.paddingLeft, right: style.paddingRight, top: style.paddingTop, bottom: style.paddingBottom };
    })).toEqual({ left: '12px', right: '12px', top: '10px', bottom: '10px' });
    expect(await tables.locator('thead th').first().evaluate(element => getComputedStyle(element).paddingBottom)).toBe('10px');
    expect(await tables.locator('tbody td').nth(1).evaluate(element => getComputedStyle(element).textAlign)).toBe('right');
    expect(await tables.locator('table').evaluate(element => getComputedStyle(element).borderCollapse)).toBe('separate');
    expect(await page.locator('[data-frame]').filter({ hasText: 'LAUNCH' }).first().innerText()).toContain('2 of 3 done');
    expect(await page.getByText('설정 확인', { exact: true }).count()).toBe(1);
    expect(await page.getByText('새 버전 적용', { exact: true }).count()).toBe(1);
    expect(await page.locator('[data-frame]').filter({ hasText: '태그 표' }).innerText()).toContain('전체');
    expect(await page.getByText('한글 안내', { exact: false }).count()).toBeGreaterThan(0);
    expect(await tables.evaluate(element => getComputedStyle(element).backgroundImage)).toBe('none');
    expect(await tables.getAttribute('data-frame')).toBe('none');
    expect(await tables.locator('.graph-rule-y').first().evaluate(element => getComputedStyle(element).display)).toBe('none');
    expect(await page.locator('.report-section').count()).toBe(3);
    expect(await page.locator('.report-section').first().evaluate(element => getComputedStyle(element, '::after').backgroundImage)).toContain('linear-gradient');
    expect(await page.locator('.report-section-grid').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(2);
    const colors = await page.locator('.report-mdxcn-GraphStack.report-mdxcn-palette-multi').first().evaluate(element => {
      return Array.from({ length: 8 }, (_, index) => {
        const selector = index ? `.text-graph-accent-${index + 1}` : '.text-graph-accent:not(.graph-title-ink)';
        const series = element.querySelector(selector);
        return series ? getComputedStyle(series).color : null;
      });
    });
    expect(colors).not.toContain(null);
    expect(new Set(colors).size).toBe(8);
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
    await page.emulateMedia({ media: 'screen' });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.locator('.report-section-grid').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    expect(await page.locator('.report-section .report-graph-corner').count()).toBe(0);
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
    await page.locator('[data-frame]').nth(88).waitFor();
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
    await page.locator('[data-frame]').nth(88).waitFor();
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
    expect(await page.locator('[data-frame]').count()).toBe(89);
  });
}, 15_000);

test("Korean multiline content keeps invoice insets, note alignment and fixed uptime cells", async () => {
  await withMdxcnPage(fixture, async page => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('[data-frame]').nth(88).waitFor();
    await page.evaluate(() => document.fonts.ready);
    for (const width of [1100, 728, 390]) {
      await page.setViewportSize({ width, height: 900 });
      const notes = await page.getByRole('figure', { name: 'K01 / 한국어 워커 설정', exact: true }).locator('.report-env-row').first().evaluate(row => {
        const name = row.querySelector('.report-env-name')!.getBoundingClientRect();
        const value = row.querySelector('.report-env-value')!.getBoundingClientRect();
        const note = row.querySelector('.report-env-note')!;
        const bounds = note.getBoundingClientRect();
        const style = getComputedStyle(note);
        return { indent: Math.round(bounds.x + parseFloat(style.paddingLeft) + parseFloat(style.borderLeftWidth) - name.x), border: style.borderLeftStyle, below: bounds.y >= Math.max(name.bottom, value.bottom), paragraphs: note.textContent?.includes('\n\n'), whitespace: getComputedStyle(note).whiteSpace, fits: bounds.right <= row.getBoundingClientRect().right + 1 };
      });
      expect(notes).toEqual({ indent: 17, border: 'solid', below: true, paragraphs: true, whitespace: 'pre-line', fits: true });
      for (const name of ['INVOICE 0041', 'QUOTE', 'K03 / 보고서 제작 내역']) {
        const invoice = page.getByRole('figure', { name, exact: true });
        expect(await invoice.locator('dd').evaluateAll(cells => cells.every(cell => getComputedStyle(cell).marginLeft === '0px'))).toBe(true);
        const inset = await invoice.locator('.report-invoice-body').evaluate(element => getComputedStyle(element).paddingLeft);
        expect(inset).toBe(width < 640 ? '16px' : '20px');
        if (width >= 728) {
          expect(await invoice.locator('table').evaluate(table => table.getBoundingClientRect().width <= table.parentElement!.clientWidth + 1)).toBe(true);
        }
      }
      for (const name of ['.env', 'WORKER']) {
        const aligned = await page.getByRole('figure', { name, exact: true }).locator('.report-env-row').first().evaluate(row => {
          const name = row.querySelector('.report-env-name')!.getBoundingClientRect();
          const note = row.querySelector('.report-env-note')!.getBoundingClientRect();
          return Math.abs(note.x - name.x - 4) < 1;
        });
        expect(aligned).toBe(true);
      }
      const widths = await page.getByRole('figure', { name: 'API', exact: true }).locator('.report-uptime-cell').evaluateAll(cells => cells.map(cell => cell.getBoundingClientRect().width));
      expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(0.1);
      const symbols = await page.getByRole('figure', { name: 'API', exact: true }).locator('.report-uptime-symbol').evaluateAll(cells => cells.map(cell => cell.getBoundingClientRect().width));
      expect(Math.max(...symbols) - Math.min(...symbols)).toBeLessThan(0.1);
      expect(await page.getByRole('figure', { name: 'API', exact: true }).locator('.report-uptime-symbol[data-custom="false"][data-status="degraded"]').count()).toBeGreaterThan(0);
      const longTable = page.getByRole('figure', { name: 'K04 / 검토 항목과 상세 설명', exact: true });
      expect(await longTable.locator('tbody td').first().locator('p').count()).toBe(2);
      expect(await page.getByRole('note', { name: 'K08 / 여러 줄 안내', exact: true }).locator('br').count()).toBe(2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    }
    expect(await page.locator('[data-mdxcn-error]').count()).toBe(0);
  });
}, 20_000);

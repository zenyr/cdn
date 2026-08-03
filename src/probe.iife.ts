declare global {
  interface Window {
    ZenyrCdnProbe?: {
      loaded: true;
      version: string;
      source: string;
    };
  }
}

const result = {
  loaded: true as const,
  version: "0.1.0",
  source: document.currentScript?.getAttribute("src") ?? "inline",
};

window.ZenyrCdnProbe = result;
window.dispatchEvent(new CustomEvent("zenyr-cdn-probe", { detail: result }));

for (const target of document.querySelectorAll<HTMLElement>(
  "[data-zenyr-cdn-probe]",
)) {
  target.dataset.status = "loaded";
  target.textContent = `PASS ${result.version}`;
}

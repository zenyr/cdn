export const version = "0.1.0";

window.dispatchEvent(
  new CustomEvent("zenyr-cdn-esm-probe", {
    detail: { loaded: true, version },
  }),
);

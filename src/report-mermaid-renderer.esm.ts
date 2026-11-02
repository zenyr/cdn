import { mount } from "pele";

export function mountDiagram(host: HTMLElement, source: string, idPrefix: string, onError: () => void): () => void {
  const diagram = mount(host, source, {
    idPrefix,
    links: false,
    images: false,
    zoom: false,
    limit: 20_000,
    maxEdges: 500,
    onError,
  });
  return () => diagram.destroy();
}

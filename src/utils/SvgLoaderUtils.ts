import { $$, Dom } from './Dom';

export class SVGLoaderUtils {

  public static buildSVG(id: string, container: HTMLElement): Dom {
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    let use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', 'image/symbols.svg#more');
    // could fallback on img in ie..
    svg.appendChild(use);
    let placeholder = $$('span', { class: 'coveo-placeholder' });
    svg.appendChild(use);
    container.appendChild(svg);
    container.appendChild(placeholder.el);
    return $$(<any>svg);
  }
}

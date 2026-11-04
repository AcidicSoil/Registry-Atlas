import * as stylex from "@stylexjs/stylex";
import { previewStyles } from "./catalogLinkPreview.stylex";
import { type ComponentPreviews } from "./componentPreviews";
import { verifiedRegistryHomepage } from "../core/sourcePageValidation";
import { escapeHtml, renderStyleXAttributes } from "./renderSafety";

const PREVIEW_ID = "catalog-link-preview";

const POINTER_DELAY_MS = 250;

/** Only verified upstream links attached by Atlas renderers qualify for previews. */
export function sourceLinkPreview(
  url: string,
  previews: ComponentPreviews = new Map(),
): { src: string; hostname: string } | null {
  const source = verifiedRegistryHomepage(url);

  return source ? (previews.get(source) ?? null) : null;
}

export function renderSourceLinkPreview(
  source: NonNullable<ReturnType<typeof sourceLinkPreview>>,
  title: string,
): string {
  return `<div${renderStyleXAttributes(stylex.attrs(previewStyles.visual))} data-preview-visual>
    <img${renderStyleXAttributes(stylex.attrs(previewStyles.image))} src="${escapeHtml(source.src)}" alt="${escapeHtml(title)} preview"
      decoding="async" referrerpolicy="no-referrer" />
  </div>`;
}

/** Link previews never change the original href, click handler, or native navigation. */
export function attachCatalogLinkPreviews(
  roots: readonly HTMLElement[],
  media: ComponentPreviews,
): void {
  let active: HTMLAnchorElement | null = null;
  let pending: number | undefined;
  let preview: HTMLElement | null = null;
  let previousDescription: string | null = null;

  function close(): void {
    window.clearTimeout(pending);
    pending = undefined;

    if (active) {
      if (previousDescription) active.setAttribute("aria-describedby", previousDescription);
      else active.removeAttribute("aria-describedby");
    }

    active = null;
    previousDescription = null;
    preview?.remove();
    preview = null;
  }

  function canPreview(): boolean {
    return window.innerWidth >= 640 && !window.matchMedia?.("(hover: none)").matches;
  }

  function previewFor(anchor: HTMLAnchorElement) {
    const sourceUrl =
      anchor.getAttribute("data-preview-source-url") ||
      (anchor.matches("[data-catalog-source], [data-related-source]") ? anchor.href : "");

    return sourceUrl ? sourceLinkPreview(sourceUrl, media) : null;
  }

  function show(anchor: HTMLAnchorElement, immediate = false): void {
    if (!anchor.isConnected || !canPreview()) return;

    const data = previewFor(anchor);

    if (!data) return;

    close();
    active = anchor;
    previousDescription = anchor.getAttribute("aria-describedby");

    const element = document.createElement("div");
    const card = anchor.closest("[data-catalog-card], [data-related-entry]");

    const title = previewTitle(card, anchor);

    element.id = PREVIEW_ID;
    const previewAttributes = stylex.attrs(previewStyles.root, immediate && previewStyles.instant);

    if (previewAttributes.class) element.className = previewAttributes.class;

    if (previewAttributes.style) element.style.cssText = previewAttributes.style;
    element.setAttribute("role", "tooltip");
    element.innerHTML = renderSourceLinkPreview(data, title);
    element.querySelector("img")?.addEventListener("error", close);

    document.body.append(element);
    preview = element;
    anchor.setAttribute(
      "aria-describedby",
      [previousDescription, PREVIEW_ID].filter(Boolean).join(" "),
    );
    position(anchor, element);
  }

  function previewTitle(card: Element | null, anchor: HTMLAnchorElement): string {
    return (
      card?.querySelector("strong, [data-related-title]")?.textContent?.trim() ||
      anchor.getAttribute("aria-label") ||
      "Component"
    );
  }

  function trigger(event: Event): HTMLAnchorElement | null {
    const target = event.target;

    if (!(target instanceof Element)) return null;

    return target.closest<HTMLAnchorElement>("a[href]");
  }

  function onPointerOver(event: PointerEvent): void {
    if (event.pointerType === "touch" || !canPreview()) return;

    const anchor = trigger(event);

    if (!anchor || anchor === active) return;

    close();
    pending = window.setTimeout(() => show(anchor), POINTER_DELAY_MS);
  }

  function onPointerOut(event: PointerEvent): void {
    const anchor = trigger(event);

    if (!anchor) return;

    const next = event.relatedTarget;

    if (next instanceof Node && anchor.contains(next)) return;

    close();
  }

  function onFocusIn(event: FocusEvent): void {
    if (!canPreview()) return;

    const anchor = trigger(event);

    if (anchor) show(anchor, true);
  }

  function onFocusOut(event: FocusEvent): void {
    if (trigger(event)) close();
  }

  for (const root of roots) {
    root.addEventListener("pointerover", onPointerOver);
    root.addEventListener("pointerout", onPointerOut);
    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("focusout", onFocusOut);
  }

  const observer = new MutationObserver(close);

  for (const root of roots) observer.observe(root, { childList: true });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });

  document.addEventListener("scroll", close, true);
  window.addEventListener("resize", close);
}

function position(anchor: HTMLAnchorElement, element: HTMLElement): void {
  const rect = anchor.getBoundingClientRect();
  const width = element.getBoundingClientRect().width;
  const height = element.getBoundingClientRect().height;
  const margin = 12;

  const left = Math.max(margin, Math.min(rect.left, window.innerWidth - width - margin));

  const top =
    window.innerHeight - rect.bottom >= height + margin
      ? rect.bottom + margin
      : Math.max(margin, rect.top - height - margin);

  element.style.left = `${left}px`;
  element.style.top = `${top}px`;
}

import { aceternityVisualEvidence } from './aceternityVisualEvidence';

const aceternityVisuals = new Map<string, string>(Object.entries(aceternityVisualEvidence));

type VisualRule = {
  host: string;
  path: RegExp;
  asset: (parts: RegExpExecArray) => string;
};

/**
 * Approved exact-item media patterns. Each provider has been checked against
 * more than one real item; shared Open Graph or marketing cards are excluded.
 */
const visualRules: readonly VisualRule[] = [
  {
    host: 'logoforge.terravidhal.me',
    path: /^\/logos\/([a-z0-9][a-z0-9-]*)$/,
    asset: parts => `https://logoforge.terravidhal.me/logos/${parts[1]}/icon.svg`,
  },
  {
    host: 'keylineicons.com',
    path: /^\/icons\/([a-z0-9][a-z0-9-]*)$/,
    asset: parts => `https://keylineicons.com/icons/${parts[1]}/opengraph-image/card`,
  },
  {
    host: 'animateicons.in',
    path: /^\/icons\/(huge|lucide)\/([a-z0-9][a-z0-9-]*)$/,
    asset: parts => `https://animateicons.in/icons/${parts[1]}/${parts[2]}/opengraph-image`,
  },
  {
    host: 'shadcnblocks.com',
    path: /^\/block\/([a-z0-9][a-z0-9-]*)$/,
    asset: parts => `https://cdn.shadcnblocks.com/shadcnblocks/screenshots/block/${parts[1]}-4x3.webp`,
  },
  {
    host: 'shadcnblocks.com',
    path: /^\/component\/([a-z0-9][a-z0-9-]*)\/([a-z0-9][a-z0-9-]*)$/,
    asset: parts => `https://cdn.shadcnblocks.com/shadcnblocks/screenshots/example/${parts[1]}/${parts[2]}-4x3.webp`,
  },
  {
    host: 'reui.io',
    path: /^\/(blocks|components)\/[a-z0-9][a-z0-9-]*(?:\/[a-z0-9][a-z0-9-]*)*\/([a-z0-9][a-z0-9-]*)$/,
    asset: parts => `https://reui.io/thumbnails/${parts[1]}/${parts[2]}-light.webp`,
  },
  {
    host: 'reactframe.com',
    path: /^\/components\/([a-z0-9][a-z0-9-]*)$/,
    asset: parts => `https://reactframe.com/components/${parts[1]}/opengraph-image`,
  },
];

export function publishedComponentAsset(page: URL): string | null {
  const exactMedia = aceternityVisuals.get(page.href);

  if (exactMedia) return exactMedia;

  const path = page.pathname.replace(/\/$/, '');

  for (const rule of visualRules) {
    if (rule.host !== page.hostname.toLowerCase()) continue;

    const parts = rule.path.exec(path);

    if (parts) return rule.asset(parts);
  }

  return null;
}

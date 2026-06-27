import type { ComponentTag } from './registry.schema';

export type ComponentTaxonomyCategory =
  | 'ai-and-chat'
  | 'badges-and-chips'
  | 'buttons-and-controls'
  | 'callouts-and-alerts'
  | 'carousels-and-swipers'
  | 'code-and-markdown'
  | 'data-display-and-document'
  | 'data-generation'
  | 'feedback-and-progress'
  | 'form-controls'
  | 'maps-and-location'
  | 'media-and-comparison'
  | 'media-and-images'
  | 'styles-and-themes'
;

export interface ComponentTaxonomyExampleItem {
  registry: string;
  slug: string;
  url: string;
}

export interface ComponentTaxonomyEntry {
  tag: ComponentTag;
  label: string;
  category: ComponentTaxonomyCategory;
  categoryLabel: string;
  reason: string;
  exampleItems: readonly ComponentTaxonomyExampleItem[];
}

export const COMPONENT_TAXONOMY_CATEGORIES: Readonly<Record<ComponentTaxonomyCategory, string>> = {
  'ai-and-chat': 'AI & Chat',
  'badges-and-chips': 'Badges & Chips',
  'buttons-and-controls': 'Buttons & Controls',
  'callouts-and-alerts': 'Callouts & Alerts',
  'carousels-and-swipers': 'Carousels & Swipers',
  'code-and-markdown': 'Code & Markdown',
  'data-display-and-document': 'Data Display & Documents',
  'data-generation': 'Data Generation',
  'feedback-and-progress': 'Feedback & Progress',
  'form-controls': 'Forms',
  'maps-and-location': 'Maps & Location',
  'media-and-comparison': 'Media & Comparison',
  'media-and-images': 'Media & Images',
  'styles-and-themes': 'Styles & Themes',
};

export const COMPONENT_TAXONOMY: readonly ComponentTaxonomyEntry[] = [
  {
    tag: "theme",
    label: "Theme",
    category: "styles-and-themes",
    categoryLabel: "Styles & Themes",
    reason: "Delego provides a theme component containing design tokens mapped onto shadcn variables, which is not covered by existing tags.",
    exampleItems: [
      {
        registry: "@delego",
        slug: "delego-theme",
        url: "https://raw.githubusercontent.com/Delego-Dev/registry/main/public/r/delego-theme.json"
      }
    ]
  },
  {
    tag: "status-pill",
    label: "Status pill",
    category: "badges-and-chips",
    categoryLabel: "Badges & Chips",
    reason: "The status\u2011badge component combines a pill\u2011shaped badge with status colours (allow/deny/approval), so a new tag distinguishes these status chips from generic badges.",
    exampleItems: [
      {
        registry: "@delego",
        slug: "status-badge",
        url: "https://raw.githubusercontent.com/Delego-Dev/registry/main/public/r/status-badge.json"
      }
    ]
  },
  {
    tag: "decision-pill",
    label: "Decision pill",
    category: "badges-and-chips",
    categoryLabel: "Badges & Chips",
    reason: "Delego\u2019s decision-pill component renders an allow/approve/deny decision with icon and colour; no existing tag captures this unique element.",
    exampleItems: [
      {
        registry: "@delego",
        slug: "decision-pill",
        url: "https://raw.githubusercontent.com/Delego-Dev/registry/main/public/r/decision-pill.json"
      }
    ]
  },
  {
    tag: "pill",
    label: "Pill/Chip",
    category: "badges-and-chips",
    categoryLabel: "Badges & Chips",
    reason: "While generic badges exist, pill\u2011shaped chips are distinct and appear in multiple registries (e.g., decision-pill, status-badge).",
    exampleItems: [
      {
        registry: "@delego",
        slug: "decision-pill",
        url: "https://raw.githubusercontent.com/Delego-Dev/registry/main/public/r/decision-pill.json"
      }
    ]
  },
  {
    tag: "receipt",
    label: "Receipt / Audit record",
    category: "data-display-and-document",
    categoryLabel: "Data Display & Documents",
    reason: "Delego\u2019s signed-receipt component produces a hash\u2011chained ledger record; this unique data\u2011display item merits its own tag.",
    exampleItems: [
      {
        registry: "@delego",
        slug: "signed-receipt",
        url: "https://raw.githubusercontent.com/Delego-Dev/registry/main/public/r/signed-receipt.json"
      }
    ]
  },
  {
    tag: "audit",
    label: "Audit visual",
    category: "data-display-and-document",
    categoryLabel: "Data Display & Documents",
    reason: "Signed receipt functions as an audit trail visual; a dedicated tag helps filter audit\u2011oriented components.",
    exampleItems: [
      {
        registry: "@delego",
        slug: "signed-receipt",
        url: "https://raw.githubusercontent.com/Delego-Dev/registry/main/public/r/signed-receipt.json"
      }
    ]
  },
  {
    tag: "otp-input",
    label: "OTP input",
    category: "form-controls",
    categoryLabel: "Forms",
    reason: "Delta\u2019s input\u2011otp component provides a multi\u2011field one\u2011time\u2011password input; this pattern deserves a separate tag for security and auth flows.",
    exampleItems: [
      {
        registry: "@delta",
        slug: "input-otp",
        url: "https://deltacomponents.dev/r/input-otp.json"
      }
    ]
  },
  {
    tag: "code-block",
    label: "Code block",
    category: "code-and-markdown",
    categoryLabel: "Code & Markdown",
    reason: "Delta offers a syntax\u2011highlighted code block with copy functionality; adding a dedicated tag facilitates discovery of developer\u2011oriented components.",
    exampleItems: [
      {
        registry: "@delta",
        slug: "code-block",
        url: "https://deltacomponents.dev/r/code-block.json"
      }
    ]
  },
  {
    tag: "syntax-highlighting",
    label: "Syntax highlighting",
    category: "code-and-markdown",
    categoryLabel: "Code & Markdown",
    reason: "The code-block component includes syntax highlighting via Prism libraries; a specific tag enables filtering by this capability.",
    exampleItems: [
      {
        registry: "@delta",
        slug: "code-block",
        url: "https://deltacomponents.dev/r/code-block.json"
      }
    ]
  },
  {
    tag: "utility-button",
    label: "Utility button",
    category: "buttons-and-controls",
    categoryLabel: "Buttons & Controls",
    reason: "Delta\u2019s copy-button component is a specialized button used to copy text to the clipboard; tagging it as a utility button distinguishes it from primary/secondary buttons.",
    exampleItems: [
      {
        registry: "@delta",
        slug: "copy-button",
        url: "https://deltacomponents.dev/r/copy-button.json"
      }
    ]
  },
  {
    tag: "zoomable-image",
    label: "Zoomable image",
    category: "media-and-images",
    categoryLabel: "Media & Images",
    reason: "The cambio-image component implements interactive zooming on images; creating a tag aids in finding advanced image components.",
    exampleItems: [
      {
        registry: "@delta",
        slug: "cambio-image",
        url: "https://deltacomponents.dev/r/cambio-image.json"
      }
    ]
  },
  {
    tag: "card-deck",
    label: "Card deck",
    category: "carousels-and-swipers",
    categoryLabel: "Carousels & Swipers",
    reason: "Delta\u2019s card-deck component creates a swipeable stack of cards using framer-motion and swiper; this pattern merits its own tag.",
    exampleItems: [
      {
        registry: "@delta",
        slug: "card-deck",
        url: "https://deltacomponents.dev/r/card-deck.json"
      }
    ]
  },
  {
    tag: "admonition",
    label: "Admonition",
    category: "callouts-and-alerts",
    categoryLabel: "Callouts & Alerts",
    reason: "Admonition provides stylized callout boxes for notes or warnings; a tag helps differentiate these from generic alerts.",
    exampleItems: [
      {
        registry: "@delta",
        slug: "admonition",
        url: "https://deltacomponents.dev/r/admonition.json"
      }
    ]
  },
  {
    tag: "qr-code",
    label: "QR code",
    category: "data-generation",
    categoryLabel: "Data Generation",
    reason: "Delta includes a QR code component using qr-code-styling; adding a tag makes it easy to find code\u2011generation widgets.",
    exampleItems: [
      {
        registry: "@delta",
        slug: "qrcode",
        url: "https://deltacomponents.dev/r/qrcode.json"
      }
    ]
  },
  {
    tag: "chat-interface",
    label: "Chat interface",
    category: "ai-and-chat",
    categoryLabel: "AI & Chat",
    reason: "Delta\u2019s chat component is a streaming chat interface for LLM interactions; a dedicated tag supports discovery of AI chat UIs.",
    exampleItems: [
      {
        registry: "@delta",
        slug: "chat",
        url: "https://deltacomponents.dev/r/chat.json"
      }
    ]
  },
  {
    tag: "ai-chat",
    label: "AI chat",
    category: "ai-and-chat",
    categoryLabel: "AI & Chat",
    reason: "Some chat components are specifically designed for AI or LLM conversations; this tag captures that specialization.",
    exampleItems: [
      {
        registry: "@delta",
        slug: "chat",
        url: "https://deltacomponents.dev/r/chat.json"
      }
    ]
  },
  {
    tag: "map-pointer",
    label: "Map pointer",
    category: "maps-and-location",
    categoryLabel: "Maps & Location",
    reason: "Delta provides a mapbox-pointer component for interactive maps; adding a tag for map pointers aids search for location widgets.",
    exampleItems: [
      {
        registry: "@delta",
        slug: "mapbox-pointer",
        url: "https://deltacomponents.dev/r/mapbox-pointer.json"
      }
    ]
  },
  {
    tag: "angle-slider",
    label: "Angle slider",
    category: "form-controls",
    categoryLabel: "Forms",
    reason: "Dice UI\u2019s angle-slider is a radial input not represented by existing slider tags; a dedicated tag differentiates it from linear sliders.",
    exampleItems: [
      {
        registry: "@diceui",
        slug: "angle-slider",
        url: "https://diceui.com/r/angle-slider.json"
      }
    ]
  },
  {
    tag: "circular-progress",
    label: "Circular progress",
    category: "feedback-and-progress",
    categoryLabel: "Feedback & Progress",
    reason: "Dice UI offers a circular-progress indicator with custom animations; introducing a tag helps group radial progress indicators.",
    exampleItems: [
      {
        registry: "@diceui",
        slug: "circular-progress",
        url: "https://diceui.com/r/circular-progress.json"
      }
    ]
  },
  {
    tag: "color-picker",
    label: "Color picker",
    category: "form-controls",
    categoryLabel: "Forms",
    reason: "Dice UI supplies a complex color picker built on multiple primitives; a dedicated tag aligns with user expectations and parallels other UI libraries.",
    exampleItems: [
      {
        registry: "@diceui",
        slug: "color-picker",
        url: "https://diceui.com/r/color-picker.json"
      }
    ]
  },
  {
    tag: "color-swatch",
    label: "Color swatch",
    category: "form-controls",
    categoryLabel: "Forms",
    reason: "Color swatches are small selectable colour squares used by color pickers; adding this tag captures such mini controls.",
    exampleItems: [
      {
        registry: "@diceui",
        slug: "color-swatch",
        url: "https://diceui.com/r/color-swatch.json"
      }
    ]
  },
  {
    tag: "compare-slider",
    label: "Compare slider",
    category: "media-and-comparison",
    categoryLabel: "Media & Comparison",
    reason: "Dice UI\u2019s compare-slider allows dragging a handle to reveal one image over another; this pattern needs its own tag for A/B comparison components.",
    exampleItems: [
      {
        registry: "@diceui",
        slug: "compare-slider",
        url: "https://diceui.com/r/compare-slider.json"
      }
    ]
  },
  {
    tag: "cropper",
    label: "Image cropper",
    category: "media-and-images",
    categoryLabel: "Media & Images",
    reason: "Dice UI includes a cropper for selecting image regions; a dedicated tag helps identify image editing controls.",
    exampleItems: [
      {
        registry: "@diceui",
        slug: "cropper",
        url: "https://diceui.com/r/cropper.json"
      }
    ]
  }
] as const satisfies readonly ComponentTaxonomyEntry[];

const TAXONOMY_BY_TAG = new Map<ComponentTag, ComponentTaxonomyEntry>(
  COMPONENT_TAXONOMY.map(entry => [entry.tag, entry]),
);

export function componentTaxonomyEntry(tag: string | undefined | null): ComponentTaxonomyEntry | undefined {
  if (!tag) return undefined;
  return TAXONOMY_BY_TAG.get(tag as ComponentTag);
}

export function componentTaxonomyLabel(tag: ComponentTag): string {
  return componentTaxonomyEntry(tag)?.label ?? tag.replace(/-/g, ' ');
}

export function componentTaxonomyCategory(tag: ComponentTag): ComponentTaxonomyCategory | undefined {
  return componentTaxonomyEntry(tag)?.category;
}

export function componentTaxonomyCategoryLabel(category: ComponentTaxonomyCategory | undefined | null): string {
  return category ? COMPONENT_TAXONOMY_CATEGORIES[category] : '';
}

const COMPONENT_TAXONOMY_ALIASES: Readonly<Partial<Record<ComponentTag, readonly string[]>>> = {
  'qr-code': ['qr', 'qrcode', 'qr code'],
  'otp-input': ['otp', 'one time password', 'one-time-password', 'auth code'],
  'code-block': ['code', 'snippet', 'code snippet'],
  'syntax-highlighting': ['syntax', 'highlight', 'highlighting', 'prism'],
  'chat-interface': ['chat', 'chatbot', 'conversation'],
  'ai-chat': ['ai', 'ai chat', 'llm', 'chat'],
  'map-pointer': ['map', 'maps', 'location', 'mapbox', 'pointer'],
  'receipt': ['ledger', 'record', 'receipt'],
  'audit': ['audit trail', 'audit log'],
  'theme': ['theme', 'design tokens', 'tokens'],
  'status-pill': ['status', 'status badge', 'status chip'],
  'decision-pill': ['decision', 'approve', 'deny', 'allow'],
  'pill': ['chip', 'pill chip'],
  'utility-button': ['copy', 'copy button', 'clipboard'],
  'zoomable-image': ['zoom', 'image zoom', 'zoomable'],
  'card-deck': ['cards', 'deck', 'swipe cards'],
  'admonition': ['callout', 'note', 'warning'],
  'angle-slider': ['angle', 'radial slider'],
  'circular-progress': ['circle progress', 'radial progress'],
  'color-picker': ['color', 'colour', 'picker', 'palette'],
  'color-swatch': ['color', 'swatch', 'palette'],
  'compare-slider': ['compare', 'comparison', 'before after'],
  'cropper': ['crop', 'image crop', 'image cropper'],
};

export function normalizeTaxonomySearchTerm(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function componentTaxonomyAliases(tag: ComponentTag): readonly string[] {
  return COMPONENT_TAXONOMY_ALIASES[tag] ?? [];
}

export function componentTaxonomySearchValues(tag: ComponentTag): readonly string[] {
  const entry = componentTaxonomyEntry(tag);
  const values = new Set<string>([tag]);
  if (entry) {
    values.add(entry.label);
    values.add(entry.category);
    values.add(entry.categoryLabel);
    entry.exampleItems.forEach(item => values.add(item.slug));
  }
  componentTaxonomyAliases(tag).forEach(alias => values.add(alias));
  return [...values].map(normalizeTaxonomySearchTerm).filter(Boolean);
}

export function expandComponentSearchTerms(value: string): readonly string[] {
  const query = normalizeTaxonomySearchTerm(value);
  if (!query) return [];

  const expanded = new Set<string>([query]);
  COMPONENT_TAXONOMY.forEach(entry => {
    const broadValues = componentTaxonomySearchValues(entry.tag);
    if (broadValues.some(term => term.includes(query) || query.includes(term))) {
      [
        entry.tag,
        entry.label,
        ...componentTaxonomyAliases(entry.tag),
        ...entry.exampleItems.map(item => item.slug),
      ]
        .map(normalizeTaxonomySearchTerm)
        .filter(Boolean)
        .forEach(term => expanded.add(term));
    }
  });

  return [...expanded];
}

export function taxonomyTagsForValues(values: readonly (string | undefined)[]): ComponentTag[] {
  const tags = new Set<ComponentTag>();
  values.forEach(value => {
    if (!value) return;
    const normalized = normalizeTaxonomySearchTerm(value);
    COMPONENT_TAXONOMY.forEach(entry => {
      if (entry.tag === value || componentTaxonomySearchValues(entry.tag).includes(normalized)) {
        tags.add(entry.tag);
      }
    });
  });
  return [...tags];
}

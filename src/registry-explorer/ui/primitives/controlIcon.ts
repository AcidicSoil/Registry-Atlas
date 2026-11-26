const paths = {
  "chevron-down": '<path d="m6 9 6 6 6-6"/>',
  "chevron-right": '<path d="m9 18 6-6-6-6"/>',
  "chevron-left": '<path d="m15 18-6-6 6-6"/>',
  "arrow-left": '<path d="m12 19-7-7 7-7M5 12h14"/>',
  "arrow-right": '<path d="M5 12h14m-7-7 7 7-7 7"/>',
  "arrow-up-right": '<path d="M7 17 17 7M7 7h10v10"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
};

export function controlIcon(name: keyof typeof paths, classes = ""): string {
  return `<svg data-ui-icon="${name}" class="inline-block size-3.5 shrink-0 align-middle pointer-events-none ${classes}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]}</svg>`;
}

export const dropdownChevron = () =>
  controlIcon(
    "chevron-down",
    "text-atlas-muted-foreground transition-transform duration-150 motion-reduce:transition-none group-aria-expanded/dropdown:[transform:rotate(180deg)]",
  );

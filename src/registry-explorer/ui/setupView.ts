import { actionClasses } from "./primitives/actionClasses";
import { installCommandClasses } from "./primitives/installCommandClasses";
import { buildInstallQueueBatchState } from "../core/installQueue.ts";
import { buildSetupPrompt } from "../core/itemPrompts.ts";
import type { InstallQueueEntry } from "../core/registry.schema.ts";
import { escapeHtml } from "./renderSafety.ts";

export function renderSetupView(
  header: HTMLElement,
  body: HTMLElement,
  items: readonly InstallQueueEntry[],
  instructions: string,
  review: boolean,
): void {
  header.innerHTML = `<div class="setup-page-heading flex flex-wrap items-start justify-between gap-[18px] [&_h1]:m-0 [&_h1]:mb-2 [&_p]:m-0 [&_p]:text-atlas-muted-foreground [&>a]:no-underline">
    <div><h1>${review ? "Review setup" : "Your setup"}</h1>
    <p>${
      review
        ? "Copy the installation command or prepare instructions for your coding agent."
        : "Choose components to install together. No checkout or payment."
    }</p></div>
    <a href="/Registry-Atlas/components" data-catalog-route="/Registry-Atlas/components"
      class="install-button ${actionClasses.install}">Browse components</a>
  </div>`;

  if (!items.length) {
    body.innerHTML = `<div class="setup-empty grid justify-items-start gap-3.5 py-6 [&_h2]:m-0 [&_p]:m-0 [&_p]:text-atlas-muted-foreground [&_a]:no-underline">
      <h2>Your setup is empty</h2>
      <p>Find components in the catalog and add them here.</p>
      <a href="/Registry-Atlas/components" class="install-button install-button-primary ${actionClasses.primary}"
        data-catalog-route="/Registry-Atlas/components">Browse components</a>
    </div>`;

    return;
  }

  const batch = buildInstallQueueBatchState(items);
  body.innerHTML = `<div class="setup-page-layout grid max-w-[1120px] grid-cols-[minmax(0,1fr)_minmax(245px,310px)] items-start gap-7 max-[800px]:grid-cols-1">
    <div class="setup-page-content min-w-0">
      ${
        review
          ? renderReview(items, instructions, batch.command)
          : renderSelections(items, instructions)
      }
    </div>
    <aside class="setup-summary grid gap-[18px] rounded-[var(--atlas-radius-card)] border border-atlas-border p-5 max-[800px]:row-start-1 [&>h2]:m-0 [&>h2]:text-base [&>p]:m-0 [&>p]:text-[13px] [&>p]:text-atlas-muted-foreground" aria-label="Setup summary">
      <h2>Summary</h2>
      <div class="setup-summary-count flex justify-between border-y border-atlas-border py-3 text-[13px]"><span>Components</span><strong>${items.length}</strong></div>
      <p>No payment or automatic installation.</p>
      ${
        review
          ? `<button class="install-button ${actionClasses.install}" type="button" data-setup-edit>Back to setup</button>`
          : `<button class="install-button install-button-primary ${actionClasses.primary}" type="button" data-setup-review>
           Review setup</button>`
      }
    </aside>
  </div>`;
}

function renderSelections(items: readonly InstallQueueEntry[], instructions: string): string {
  return `<div class="setup-selection-list border-t border-atlas-border" aria-label="Selected components">
    ${items.map(renderSelection).join("")}
  </div>
  <label class="setup-instructions-label block mt-6 mb-2.5 text-[13px] font-semibold" for="setupInstructions">Special instructions (optional)</label>
  <textarea class="box-border w-full min-h-[104px] resize-y rounded-[var(--atlas-radius-button)] border border-atlas-border bg-atlas-background p-3 text-[13px] text-atlas-foreground" id="setupInstructions" data-setup-instructions rows="4" maxlength="2000"
    placeholder="Project-specific constraints for the coding agent.">${escapeHtml(instructions)}</textarea>
  <p class="setup-instructions-help text-xs text-atlas-muted-foreground">These instructions are included in the copied setup prompt.</p>`;
}

function renderSelection(item: InstallQueueEntry): string {
  const link = item.path
    ? `<a href="${escapeHtml(item.path)}" data-catalog-route="${escapeHtml(item.path)}">${escapeHtml(item.label)}</a>`
    : `<strong>${escapeHtml(item.label)}</strong>`;

  return `<section class="setup-selection flex items-center justify-between gap-4 border-b border-atlas-border py-[18px] max-[520px]:flex-col max-[520px]:items-start">
    <div class="setup-selection-description grid min-w-0 gap-[5px] [&>a]:text-sm [&>a]:font-semibold [&>a]:text-atlas-foreground [&>a]:no-underline [&>a:hover]:underline [&>strong]:text-sm [&>strong]:font-semibold [&>strong]:text-atlas-foreground [&>span]:text-xs [&>span]:text-atlas-muted-foreground [&>code]:text-xs [&>code]:text-atlas-muted-foreground [&>code]:[overflow-wrap:anywhere]">${link}
      <span>${escapeHtml(item.registry)}</span>
      <code>${escapeHtml(item.token)}</code></div>
    <div class="setup-selection-actions flex flex-none gap-2 [&>button]:whitespace-nowrap">
      <button class="install-button ${actionClasses.install}" type="button" data-setup-replace="${escapeHtml(item.token)}">Replace</button>
      <button class="install-button ${actionClasses.install}" type="button" data-queue-remove="${escapeHtml(item.token)}"
        aria-label="Remove ${escapeHtml(item.label)}">Remove</button>
    </div>
  </section>`;
}

function renderReview(
  items: readonly InstallQueueEntry[],
  instructions: string,
  command: string | null,
): string {
  const prompt = buildSetupPrompt(items, instructions);

  return `<div class="setup-review-content grid gap-7">
    <section class="setup-review-section grid min-w-0 gap-3.5 [&>h2]:m-0 [&>h2]:text-base [&>p]:m-0 [&>p]:text-[13px] [&>p]:text-atlas-muted-foreground [&>button]:justify-self-start">
      <h2>Install command</h2><p>Run this command in your project if you prefer to install directly.</p>
      <div class="setup-review-command ${installCommandClasses.row}"><code class="${installCommandClasses.code}">${escapeHtml(command ?? "")}</code>
        <button class="install-button ${actionClasses.install}" type="button" data-copy-text="${escapeHtml(command ?? "")}"
          data-copy-label="Setup command copied">Copy command</button></div>
    </section>
    <section class="setup-review-section grid min-w-0 gap-3.5 [&>h2]:m-0 [&>h2]:text-base [&>p]:m-0 [&>p]:text-[13px] [&>p]:text-atlas-muted-foreground [&>button]:justify-self-start">
      <h2>Coding-agent instructions</h2>
      <p>Copy these instructions to your coding agent. It will need your approval before changing files.</p>
      <pre class="setup-review-prompt ${installCommandClasses.code} max-h-[370px] overflow-auto whitespace-pre-wrap leading-[1.65]">${escapeHtml(prompt ?? "")}</pre>
      <button class="install-button install-button-primary ${actionClasses.primary}" type="button"
        data-copy-text="${escapeHtml(prompt ?? "")}" data-copy-label="Setup instructions copied">Copy instructions</button>
    </section>
  </div>`;
}

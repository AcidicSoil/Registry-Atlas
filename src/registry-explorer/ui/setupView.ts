import { buildInstallQueueBatchState } from '../core/installQueue.ts';
import { buildSetupPrompt } from '../core/itemPrompts.ts';
import type { InstallQueueEntry } from '../core/registry.schema.ts';
import { escapeHtml } from './renderSafety.ts';

export function renderSetupView(
  header: HTMLElement,
  body: HTMLElement,
  items: readonly InstallQueueEntry[],
  instructions: string,
  review: boolean,
): void {
  header.innerHTML = `<div class="setup-page-heading">
    <div><h1>${review ? 'Review setup' : 'Your setup'}</h1>
    <p>${review ? 'Copy the installation command or prepare instructions for your coding agent.' :
      'Choose components to install together. No checkout or payment.'}</p></div>
    <a href="/Registry-Atlas/components" data-catalog-route="/Registry-Atlas/components"
      class="install-button">Browse components</a>
  </div>`;

  if (!items.length) {
    body.innerHTML = `<div class="setup-empty">
      <h2>Your setup is empty</h2>
      <p>Find components in the catalog and add them here.</p>
      <a href="/Registry-Atlas/components" class="install-button install-button-primary"
        data-catalog-route="/Registry-Atlas/components">Browse components</a>
    </div>`;

    return;
  }

  const batch = buildInstallQueueBatchState(items);
  body.innerHTML = `<div class="setup-page-layout">
    <div class="setup-page-content">
      ${review ? renderReview(items, instructions, batch.command) :
        renderSelections(items, instructions)}
    </div>
    <aside class="setup-summary" aria-label="Setup summary">
      <h2>Summary</h2>
      <div class="setup-summary-count"><span>Components</span><strong>${items.length}</strong></div>
      <p>No payment or automatic installation.</p>
      ${review
        ? `<button class="install-button" type="button" data-setup-edit>Back to setup</button>`
        : `<button class="install-button install-button-primary" type="button" data-setup-review>
           Review setup</button>`}
    </aside>
  </div>`;
}

function renderSelections(items: readonly InstallQueueEntry[], instructions: string): string {
  return `<div class="setup-selection-list" aria-label="Selected components">
    ${items.map(renderSelection).join('')}
  </div>
  <label class="setup-instructions-label" for="setupInstructions">Special instructions (optional)</label>
  <textarea id="setupInstructions" data-setup-instructions rows="4" maxlength="2000"
    placeholder="Project-specific constraints for the coding agent.">${escapeHtml(instructions)}</textarea>
  <p class="setup-instructions-help">These instructions are included in the copied setup prompt.</p>`;
}

function renderSelection(item: InstallQueueEntry): string {
  const link = item.path
    ? `<a href="${escapeHtml(item.path)}" data-catalog-route="${escapeHtml(item.path)}">${escapeHtml(item.label)}</a>`
    : `<strong>${escapeHtml(item.label)}</strong>`;

  return `<section class="setup-selection">
    <div class="setup-selection-description">${link}
      <span>${escapeHtml(item.registry)}</span>
      <code>${escapeHtml(item.token)}</code></div>
    <div class="setup-selection-actions">
      <button class="install-button" type="button" data-setup-replace="${escapeHtml(item.token)}">Replace</button>
      <button class="install-button" type="button" data-queue-remove="${escapeHtml(item.token)}"
        aria-label="Remove ${escapeHtml(item.label)}">Remove</button>
    </div>
  </section>`;
}

function renderReview(items: readonly InstallQueueEntry[], instructions: string, command: string | null): string {
  const prompt = buildSetupPrompt(items, instructions);

  return `<div class="setup-review-content">
    <section class="setup-review-section">
      <h2>Install command</h2><p>Run this command in your project if you prefer to install directly.</p>
      <div class="setup-review-command"><code>${escapeHtml(command ?? '')}</code>
        <button class="install-button" type="button" data-copy-text="${escapeHtml(command ?? '')}"
          data-copy-label="Setup command copied">Copy command</button></div>
    </section>
    <section class="setup-review-section">
      <h2>Coding-agent instructions</h2>
      <p>Copy these instructions to your coding agent. It will need your approval before changing files.</p>
      <pre class="setup-review-prompt">${escapeHtml(prompt ?? '')}</pre>
      <button class="install-button install-button-primary" type="button"
        data-copy-text="${escapeHtml(prompt ?? '')}" data-copy-label="Setup instructions copied">Copy instructions</button>
    </section>
  </div>`;
}

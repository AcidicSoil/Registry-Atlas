import { addToInstallQueue, removeFromInstallQueue } from "../core/installQueue";
import { SETUP_DRAFT_STORAGE_KEY, parseSetupDraft, serializeSetupDraft } from "../core/setupDraft";
import type { InstallQueueEntry } from "../core/registry.schema";
import { escapeHtml } from "./renderSafety";
import type { AppState, CopyFeedback, NavigateShell } from "./shellState";

interface SetupDependencies {
  getState: () => Pick<AppState, "installQueue" | "setupInstructions">;
  setState: (partial: Partial<AppState>) => void;
  navigate: NavigateShell;
  render: () => void;
}

export function createShellSetupController({
  getState,
  setState,
  navigate,
  render,
}: SetupDependencies) {
  const replacementStorageKey = "registry-atlas.setup.pending-replacement.v1";
  let replacementToken: string | null = null;

  function readPendingReplacement(items: readonly InstallQueueEntry[]): string | null {
    try {
      const token = window.sessionStorage?.getItem(replacementStorageKey);

      return items.some((item) => item.token === token) ? token : null;
    } catch {
      return null;
    }
  }

  function setPendingReplacement(token: string | null): void {
    replacementToken = token;

    try {
      if (token) window.sessionStorage?.setItem(replacementStorageKey, token);
      else window.sessionStorage?.removeItem(replacementStorageKey);
    } catch {
      // Navigation within this page still retains the replacement selection.
    }
  }

  function restorePendingReplacement(items: readonly InstallQueueEntry[]): void {
    replacementToken = readPendingReplacement(items);
  }

  function saveSetupDraft(): void {
    try {
      window.localStorage?.setItem(
        SETUP_DRAFT_STORAGE_KEY,
        serializeSetupDraft({
          items: getState().installQueue,
          instructions: getState().setupInstructions,
        }),
      );
    } catch {
      // Persistence may be blocked; the current session remains usable.
    }
  }

  function readSavedSetup() {
    try {
      return parseSetupDraft(window.localStorage?.getItem(SETUP_DRAFT_STORAGE_KEY) ?? null);
    } catch {
      return parseSetupDraft(null);
    }
  }

  function renderReplacementNotice(header: HTMLElement): void {
    if (!replacementToken) return;

    header.insertAdjacentHTML(
      "beforeend",
      '<div class="setup-replacement-notice" role="status">Choose a replacement component.' +
        '<button class="install-button" type="button" data-setup-cancel-replace>Cancel</button></div>',
    );
  }

  function handleSetupNavigation(target: HTMLElement): boolean {
    if (target.closest("[data-setup-review]")) {
      if (getState().installQueue.length) navigate({ kind: "setup-review" });

      return true;
    }

    if (target.closest("[data-setup-edit]")) {
      navigate({ kind: "setup" });

      return true;
    }

    const replace = target.closest("[data-setup-replace]");

    if (replace) {
      const token = replace.getAttribute("data-setup-replace");

      if (!getState().installQueue.some((item) => item.token === token)) return true;

      setPendingReplacement(token);
      navigate({ kind: "components" });

      return true;
    }

    if (target.closest("[data-setup-cancel-replace]")) {
      setPendingReplacement(null);
      render();

      return true;
    }

    return false;
  }

  function handleInstall(target: HTMLElement): boolean {
    return handleSetupNavigation(target) || handleInstallCopy(target) || handleInstallQueue(target);
  }

  function handleInstallCopy(target: HTMLElement): boolean {
    const copy = target.closest("[data-copy-text], [data-copy-command]");

    if (copy) {
      const text =
        copy.getAttribute("data-copy-text") ?? copy.getAttribute("data-copy-command") ?? "";

      if (text) void copyText(text, copy.getAttribute("data-copy-label") ?? "Copied.");

      return true;
    }

    return false;
  }

  function handleInstallQueue(target: HTMLElement): boolean {
    return handleInstallQueueAdd(target) || handleInstallQueueRemove(target);
  }

  function handleInstallQueueAdd(target: HTMLElement): boolean {
    const add = target.closest("[data-queue-add]");

    if (add) {
      const remaining = replacementToken
        ? removeFromInstallQueue(getState().installQueue, replacementToken)
        : getState().installQueue;

      setPendingReplacement(null);
      setState({ installQueue: queueWithAddedItem(remaining, add) });

      return true;
    }

    return false;
  }

  function queueWithAddedItem(
    queue: readonly InstallQueueEntry[],
    add: Element,
  ): InstallQueueEntry[] {
    return addToInstallQueue(queue, {
      action: {
        status: "enabled",
        token: add.getAttribute("data-queue-add") ?? "",
        installCommand: add.getAttribute("data-queue-install") ?? "",
        inspectCommand: add.getAttribute("data-queue-inspect") ?? "",
        route: add.getAttribute("data-queue-route") ?? "",
        disabledReason: null,
      },
      label: add.getAttribute("data-queue-label") ?? "",
      registry: add.getAttribute("data-queue-registry") ?? "",
      item: add.getAttribute("data-queue-item") ?? "",
      path: window.location.pathname,
    });
  }

  function handleInstallQueueRemove(target: HTMLElement): boolean {
    const remove = target.closest("[data-queue-remove]");

    if (remove) {
      setState({
        installQueue: removeFromInstallQueue(
          getState().installQueue,
          remove.getAttribute("data-queue-remove") ?? "",
        ),
      });

      return true;
    }

    return false;
  }

  async function copyText(text: string, message: string): Promise<void> {
    try {
      if (!navigator.clipboard?.writeText) throw new Error();
      await navigator.clipboard.writeText(text);
      setState({ copyFeedback: { status: "success", message, command: text } });
    } catch {
      setState({
        copyFeedback: {
          status: "error",
          message: "Clipboard unavailable. Select and copy the text manually.",
          command: text,
        },
      });
    }
  }

  return {
    readSavedSetup,
    restorePendingReplacement,
    saveSetupDraft,
    handleInstall,
    renderReplacementNotice,
  };
}

export function renderCopyFeedback(feedback: CopyFeedback | null): string {
  if (!feedback) return "";

  return `
    <div class="copy-feedback copy-feedback-${escapeHtml(feedback.status)}" role="status" aria-live="polite" aria-atomic="true">
      <span>${escapeHtml(feedback.message)}</span>
      ${feedback.status === "error" && feedback.command ? `<code>${escapeHtml(feedback.command)}</code>` : ""}
    </div>
  `;
}


// Global confirm modal helper for destructive actions
let activeConfirmHandler = null;

const confirmModalEl = document.getElementById("confirmModal");
const confirmTitleEl = document.getElementById("confirmTitle");
const confirmSubtitleEl = document.getElementById("confirmSubtitle");
const confirmMessageEl = document.getElementById("confirmMessage");
const confirmCancelBtn = document.getElementById("confirmCancelBtn");
const confirmConfirmBtn = document.getElementById("confirmConfirmBtn");
const confirmCloseBtn = document.getElementById("confirmCloseBtn");

export function showConfirmDialog(options) {
  const {
    title = "Delete item",
    subtitle = "This action cannot be undone.",
    message = "",
    confirmLabel = "Delete",
    cancelLabel = "Cancel"
  } = options || {};

  // Fallback to native confirm dialog if the custom confirm modal
  // is not present on this page (for example inside the app dashboard).
  if (!confirmModalEl) {
    const lines = [];
    if (title) lines.push(title);
    if (subtitle) lines.push(subtitle);
    if (message) lines.push(message);
    const text = lines.filter(Boolean).join("\n\n");
    const ok = window.confirm(text || "Are you sure?");
    return Promise.resolve(!!ok);
  }

  if (confirmTitleEl) confirmTitleEl.textContent = title;
  if (confirmSubtitleEl) confirmSubtitleEl.textContent = subtitle;
  if (confirmMessageEl) confirmMessageEl.textContent = message;
  if (confirmConfirmBtn) confirmConfirmBtn.textContent = confirmLabel;
  if (confirmCancelBtn) confirmCancelBtn.textContent = cancelLabel;

  return new Promise((resolve) => {
    activeConfirmHandler = (result) => {
      if (confirmModalEl) confirmModalEl.classList.remove("open");
      activeConfirmHandler = null;
      resolve(result);
    };
    confirmModalEl.classList.add("open");
  });
}function wireConfirmModal() {
  if (!confirmModalEl) return;
  const closeHandler = () => {
    if (activeConfirmHandler) activeConfirmHandler(false);
  };
  confirmCancelBtn?.addEventListener("click", closeHandler);
  confirmCloseBtn?.addEventListener("click", closeHandler);
  confirmModalEl.addEventListener("click", (evt) => {
    if (evt.target === confirmModalEl) {
      closeHandler();
    }
  });
  window.addEventListener("keydown", (evt) => {
    if (evt.key === "Escape" && activeConfirmHandler) {
      closeHandler();
    }
  });
  confirmConfirmBtn?.addEventListener("click", () => {
    if (activeConfirmHandler) activeConfirmHandler(true);
  });
}

wireConfirmModal();

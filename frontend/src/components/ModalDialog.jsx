import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export default function ModalDialog({
  children,
  className = "",
  overlayClassName = "",
  labelledBy,
  label,
  role = "dialog",
  onClose,
}) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll(FOCUSABLE_SELECTOR);
    const preferredFocus = dialog?.querySelector("[data-modal-autofocus]");
    (preferredFocus || focusable?.[0] || dialog)?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape" && onCloseRef.current) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialog) return;
      const items = Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR));
      if (!items.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, []);

  return (
    <div className={`modal-overlay ${overlayClassName}`.trim()}>
      <section
        ref={dialogRef}
        className={`modal ${className}`.trim()}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={label}
        tabIndex={-1}
      >
        {children}
      </section>
    </div>
  );
}

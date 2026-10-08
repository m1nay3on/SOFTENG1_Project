export default function FeedbackMessage({
  message,
  type = "error",
  onDismiss,
}) {
  if (!message) return null;

  const isError = type === "error";
  return (
    <div
      className={`feedback-message feedback-${type}`}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      aria-atomic="true"
    >
      <p>{message}</p>
      {onDismiss && (
        <button
          className="feedback-dismiss"
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}

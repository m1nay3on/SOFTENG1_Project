import { useEffect, useRef } from "react";
import logo from "../assets/roadwatch-logo.png";

export default function SuccessModal({
  message,
  onClose,
}) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [onClose]);

  return (
    <div className="modal-overlay">
      <section
        className="modal success-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-modal-title"
        aria-describedby="success-modal-message"
      >
        <img
          src={logo}
          alt=""
          aria-hidden="true"
          className="modal-logo"
        />

        <div
          className="success-icon"
          aria-hidden="true"
        >
          ✓
        </div>

        <h2 id="success-modal-title">
          Success
        </h2>

        <p id="success-modal-message">
          {message}
        </p>

        <button
          ref={closeButtonRef}
          className="gold small-btn"
          type="button"
          onClick={onClose}
        >
          Continue
        </button>
      </section>
    </div>
  );
}

/* =========================================================
   MINOR MODAL
========================================================= */

export function MinorModal({ onClose }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [onClose]);

  return (
    <div className="modal-overlay">
      <section
        className="modal warning-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="minor-modal-title"
        aria-describedby="minor-modal-message"
      >
        <div
          className="warning-icon"
          aria-hidden="true"
        >
          !
        </div>

        <h2 id="minor-modal-title">
          Registration Blocked
        </h2>

        <p id="minor-modal-message">
          You must be at least 18 years old
          to create a RoadWatch account.
        </p>

        <button
          ref={closeButtonRef}
          className="gold small-btn"
          type="button"
          onClick={onClose}
        >
          Close
        </button>
      </section>
    </div>
  );
}
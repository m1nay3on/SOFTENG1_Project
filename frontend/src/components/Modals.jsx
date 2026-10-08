import logo from "../assets/roadwatch-logo.png";
import ModalDialog from "./ModalDialog";


export default function SuccessModal({ message, onClose }) {
  return (
    <ModalDialog
      className="success-modal"
      labelledBy="success-modal-title"
      onClose={onClose}
    >
        <img
          src={logo}
          alt="RoadWatch Logo"
          className="modal-logo"
        />

        <div className="success-icon">
          ✓
        </div>

        <h2 id="success-modal-title">Success</h2>

        <p>{message}</p>

        <button
          className="gold small-btn"
          onClick={onClose}
        >
          Continue
        </button>
    </ModalDialog>
  );
}

/* =========================================================
   MINOR MODAL
========================================================= */



export function MinorModal({ onClose }) {
  return (
    <ModalDialog
      className="warning-modal"
      labelledBy="minor-modal-title"
      onClose={onClose}
    >
        <div className="warning-icon">
          !
        </div>

        <h2 id="minor-modal-title">Registration Blocked</h2>

        <p>
          You must be at least 18 years old
          to create a RoadWatch account.
        </p>

        <button
          className="gold small-btn"
          onClick={onClose}
        >
          Close
        </button>
    </ModalDialog>
  );
}

/* =========================================================
   SIDEBAR
========================================================= */



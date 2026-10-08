import { useState } from "react";
import FeedbackMessage from "../../components/FeedbackMessage";
import EvidencePhoto from "../../components/EvidencePhoto";
import ReportTimeline from "../../components/ReportTimeline";


export default function InspectorReportDetails({
  setActive,
  report,
  inspector,
  onUpdateReport,
}) {
  const [notes, setNotes] =
    useState(
      report?.verificationNotes || ""
    );
  const [priority, setPriority] =
    useState(
      report?.priority || "Medium"
    );
  const [validationMessage, setValidationMessage] = useState("");
  const [saving, setSaving] = useState(false);
  if (!report) {
    return (
      <main className="main">

        <button
          className="back-btn"
          onClick={() =>
            setActive(
              "Verification Queue"
            )
          }
        >
          ← Back to Verification Queue
        </button>

        <section className="panel">

          <h2>
            Report Not Found
          </h2>

        </section>

      </main>
    );
  }

  async function updateStatus(status) {
    if (saving) return;
    if (
      (status === "Rejected" ||
        status === "Verified" ||
        status === "Needs Information") &&
      !notes.trim()
    ) {
      setValidationMessage("Please add inspector notes before saving this decision.");
      return;
    }
    setValidationMessage("");

    const inspection = {
      verificationNotes:
        notes.trim(),
      priority,
      inspectedBy: inspector
        ? `${inspector.firstName} ${inspector.lastName}`
        : "Field Inspector",
      inspectedByEmail:
        inspector?.email || "",
      inspectedAt:
        new Date().toISOString(),
    };

    if (status === "Verified") {
      inspection.verifiedBy =
        inspection.inspectedBy;
      inspection.verifiedAt =
        inspection.inspectedAt;
    }

    setSaving(true);
    try {
      const updatedReport = await onUpdateReport(report.id, status, inspection);
      if (updatedReport) setActive("Verification Queue");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="main">

      <button
        className="back-btn"
        onClick={() =>
          setActive(report.status === "Closed"
            ? "Inspector Reports"
            : "Verification Queue")
        }
      >
        ← Back to {report.status === "Closed"
          ? "Inspector Reports"
          : "Verification Queue"}
      </button>

      <div className="detail-page-header">

        <div>

          <p className="eyebrow">
            REVIEW REPORT
          </p>

          <h1>
            {report.issue}
          </h1>

          <p className="subtitle">
            Report ID: {report.id}
          </p>

        </div>

        <span
          className={`status status-${report.status
            .toLowerCase()
            .replaceAll(" ", "-")}`}
        >
          {report.status}
        </span>

      </div>

      <section className="inspector-detail-grid">

        <section className="panel evidence-panel">

          <h2>
            Evidence Photo
          </h2>

          <div className="large-evidence">
            {report.evidence ? (
              <EvidencePhoto report={report} clickable />
            ) : (
              <div>

                <span className="evidence-icon">
                  📷
                </span>

                <p>
                  Evidence photo
                  placeholder
                </p>

              </div>
            )}

          </div>

        </section>

        <section className="panel">

          <h2>
            Report Description
          </h2>

          <p className="description-text">
            {report.description}
          </p>

          <div className="detail-list">

            <p>
              <strong>
                Issue Type:
              </strong>

              {report.category}
            </p>

            <p>
              <strong>
                Date:
              </strong>

              {report.date}
            </p>

            <p>
              <strong>
                Time:
              </strong>

              {report.time}
            </p>

          </div>

        </section>

      </section>

      <section className="panel">

        <h2>
          Exact Location
        </h2>

        <p>
          <strong>
            Location:
          </strong>{" "}
          {report.location}
        </p>

        <div className="map-placeholder">

          <span>📍</span>

          <p>
            Map location will appear
            here
          </p>

          <small>
            {report.location}
          </small>

        </div>

      </section>

      <section className="panel">

        <h2>
          Citizen Information
        </h2>

        <div className="citizen-info-grid">

          <div>
            <span>Name</span>

            <strong>
              {report.reporter}
            </strong>
          </div>

          <div>
            <span>Email</span>

            <strong>
              {report.reporterEmail}
            </strong>
          </div>

        </div>

      </section>

      {report.status === "Verified" ? (
        <section className="panel inspection-summary">

          <div className="section-heading">
            <div>
              <p className="eyebrow">
                INSPECTION COMPLETE
              </p>

              <h2>
                Verification Summary
              </h2>
            </div>

            <span className="status status-verified">
              Verified
            </span>
          </div>

          <div className="detail-list">

            <p>
              <strong>
                Verified By:
              </strong>

              {report.verifiedBy ||
                report.inspectedBy ||
                "Field Inspector"}
            </p>

            <p>
              <strong>
                Verified On:
              </strong>

              {report.verifiedAt
                ? new Date(
                    report.verifiedAt
                  ).toLocaleString()
                : "Not available"}
            </p>

            <p>
              <strong>
                Priority:
              </strong>

              {report.priority}
            </p>

            <p>
              <strong>
                Notes:
              </strong>

              {report.verificationNotes ||
                "No notes provided."}
            </p>

          </div>

          <p className="inspection-readonly-note">
            This report has already been verified.
            Verification actions are no longer available.
          </p>

        </section>
      ) : report.status !== "Closed" ? (
        <>
          <section className="panel">

            <h2>
              Inspection Decision
            </h2>
            <FeedbackMessage
              message={validationMessage}
              onDismiss={() => setValidationMessage("")}
            />

            <p className="subtitle">
              Record your findings before
              submitting a verification decision.
            </p>

            <label>
              Recommended Priority

              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>

            <label>
              Inspector Notes

              <textarea
                className="notes-area"
                placeholder="Describe what you found and the recommended action..."
                value={notes}
                required
                onChange={(e) => {
                  setNotes(e.target.value);
                  setValidationMessage("");
                }}
              />
            </label>

          </section>

          <section className="panel action-panel">

            <div>
              <h2>
                Review Decision
              </h2>

              <p>
                Choose an action based on
                your verification.
              </p>
            </div>

            <div className="action-buttons">

              <button
                className="gold"
                type="button"
                disabled={saving}
                onClick={() =>
                  updateStatus("Verified")
                }
              >
                {saving ? "Saving..." : "✓ Verify Report"}
              </button>

              <button
                className="danger-btn"
                type="button"
                disabled={saving}
                onClick={() =>
                  updateStatus("Rejected")
                }
              >
                Reject Report
              </button>

              <button
                className="outline-btn"
                type="button"
                disabled={saving}
                onClick={() =>
                  updateStatus(
                    "Needs Information"
                  )
                }
              >
                Request More Information
              </button>

            </div>

          </section>
        </>
      ) : null}

      {report.status === "Closed" && (
        <ReportTimeline
          report={report}
          title="Status Timeline"
        />
      )}

    </main>
  );
}

/* =========================================================
   ADMIN
========================================================= */

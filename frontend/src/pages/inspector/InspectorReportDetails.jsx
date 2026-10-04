import { useState } from "react";
import EvidencePhoto from "../../components/EvidencePhoto";
import ReportTimeline from "../../components/ReportTimeline";

export default function InspectorReportDetails({
  setActive,
  report,
  inspector,
  onUpdateReport,
}) {
  const [notes, setNotes] = useState(
    report?.verificationNotes || ""
  );

  const [priority, setPriority] = useState(
    report?.priority || "Medium"
  );

  const [formError, setFormError] = useState("");
  const [statusUpdating, setStatusUpdating] =
    useState(false);

  if (!report) {
    return (
      <main className="main">
        <button
          className="back-btn"
          type="button"
          onClick={() =>
            setActive("Verification Queue")
          }
        >
          ← Back to Verification Queue
        </button>

        <section className="panel">
          <h2>Report Not Found</h2>

          <p>
            The selected report could not be found.
            Return to the verification queue and
            select another report.
          </p>
        </section>
      </main>
    );
  }

  async function updateStatus(status) {
    if (statusUpdating) {
      return;
    }

    setFormError("");

    const trimmedNotes = notes.trim();

    if (
      (status === "Rejected" ||
        status === "Verified" ||
        status === "Needs Information") &&
      !trimmedNotes
    ) {
      setFormError(
        "Please add inspector notes before saving this decision."
      );
      return;
    }

    const inspection = {
      verificationNotes: trimmedNotes,
      priority,
      inspectedBy: inspector
        ? `${inspector.firstName} ${inspector.lastName}`
        : "Field Inspector",
      inspectedByEmail: inspector?.email || "",
      inspectedAt: new Date().toISOString(),
    };

    if (status === "Verified") {
      inspection.verifiedBy =
        inspection.inspectedBy;
      inspection.verifiedAt =
        inspection.inspectedAt;
    }

    setStatusUpdating(true);

    try {
      const updatedReport = await onUpdateReport(
        report.id,
        status,
        inspection
      );

      if (!updatedReport) {
        return;
      }

      setActive("Verification Queue");
    } finally {
      setStatusUpdating(false);
    }
  }

  function updateNotes(value) {
    setNotes(value);

    if (formError) {
      setFormError("");
    }
  }

  function updatePriority(value) {
    setPriority(value);

    if (formError) {
      setFormError("");
    }
  }

  return (
    <main className="main">
      <button
        className="back-btn"
        type="button"
        onClick={() =>
          setActive(
            report.status === "Closed"
              ? "Inspector Reports"
              : "Verification Queue"
          )
        }
      >
        ← Back to{" "}
        {report.status === "Closed"
          ? "Inspector Reports"
          : "Verification Queue"}
      </button>

      <div className="detail-page-header">
        <div>
          <p className="eyebrow">
            REVIEW REPORT
          </p>

          <h1>{report.issue}</h1>

          <p className="subtitle">
            Report ID: {report.id}
          </p>
        </div>

        <span
          className={`status status-${String(
            report.status || ""
          )
            .toLowerCase()
            .replaceAll(" ", "-")}`}
        >
          {report.status}
        </span>
      </div>

      <section className="inspector-detail-grid">
        <section
          className="panel evidence-panel"
          aria-labelledby="evidence-photo-heading"
        >
          <h2 id="evidence-photo-heading">
            Evidence Photo
          </h2>

          <div className="large-evidence">
            {report.evidence ? (
              <EvidencePhoto
                report={report}
                clickable
              />
            ) : (
              <div>
                <span
                  className="evidence-icon"
                  aria-hidden="true"
                >
                  📷
                </span>

                <p>
                  Evidence photo placeholder
                </p>
              </div>
            )}
          </div>
        </section>

        <section
          className="panel"
          aria-labelledby="report-description-heading"
        >
          <h2 id="report-description-heading">
            Report Description
          </h2>

          <p className="description-text">
            {report.description}
          </p>

          <div className="detail-list">
            <p>
              <strong>
                Issue Type:
              </strong>{" "}
              {report.category}
            </p>

            <p>
              <strong>
                Date:
              </strong>{" "}
              {report.date}
            </p>

            <p>
              <strong>
                Time:
              </strong>{" "}
              {report.time}
            </p>
          </div>
        </section>
      </section>

      <section
        className="panel"
        aria-labelledby="exact-location-heading"
      >
        <h2 id="exact-location-heading">
          Exact Location
        </h2>

        <p>
          <strong>
            Location:
          </strong>{" "}
          {report.location}
        </p>

        <div className="map-placeholder">
          <span aria-hidden="true">
            📍
          </span>

          <p>
            Map location will appear here
          </p>

          <small>
            {report.location}
          </small>
        </div>
      </section>

      <section
        className="panel"
        aria-labelledby="citizen-information-heading"
      >
        <h2 id="citizen-information-heading">
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
        <section
          className="panel inspection-summary"
          aria-labelledby="verification-summary-heading"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                INSPECTION COMPLETE
              </p>

              <h2 id="verification-summary-heading">
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
              </strong>{" "}
              {report.verifiedBy ||
                report.inspectedBy ||
                "Field Inspector"}
            </p>

            <p>
              <strong>
                Verified On:
              </strong>{" "}
              {report.verifiedAt
                ? new Date(
                    report.verifiedAt
                  ).toLocaleString()
                : "Not available"}
            </p>

            <p>
              <strong>
                Priority:
              </strong>{" "}
              {report.priority}
            </p>

            <p>
              <strong>
                Notes:
              </strong>{" "}
              {report.verificationNotes ||
                "No notes provided."}
            </p>
          </div>

          <p className="inspection-readonly-note">
            This report has already been verified.
            Verification actions are no longer
            available.
          </p>
        </section>
      ) : report.status !== "Closed" ? (
        <>
          <section
            className="panel"
            aria-labelledby="inspection-decision-heading"
          >
            <h2 id="inspection-decision-heading">
              Inspection Decision
            </h2>

            <p className="subtitle">
              Record your findings before
              submitting a verification decision.
            </p>

            <div className="inspector-form-field">
              <label htmlFor="inspection-priority">
                Recommended Priority
              </label>

              <select
                id="inspection-priority"
                name="priority"
                value={priority}
                disabled={statusUpdating}
                onChange={(event) =>
                  updatePriority(
                    event.target.value
                  )
                }
              >
                <option value="Low">
                  Low
                </option>

                <option value="Medium">
                  Medium
                </option>

                <option value="High">
                  High
                </option>
              </select>
            </div>

            <div className="inspector-form-field">
              <label htmlFor="inspection-notes">
                Inspector Notes
              </label>

              <textarea
                id="inspection-notes"
                name="inspectionNotes"
                className="notes-area"
                placeholder="Describe what you found and the recommended action..."
                value={notes}
                required
                disabled={statusUpdating}
                aria-describedby={
                  formError
                    ? "inspection-form-error"
                    : undefined
                }
                onChange={(event) =>
                  updateNotes(
                    event.target.value
                  )
                }
              />
            </div>

            {formError && (
              <div
                id="inspection-form-error"
                className="login-error inspector-form-error"
                role="alert"
                aria-live="assertive"
              >
                <span
                  className="login-error-icon"
                  aria-hidden="true"
                >
                  ⚠
                </span>

                <span>{formError}</span>
              </div>
            )}
          </section>

          <section
            className="panel action-panel"
            aria-labelledby="review-decision-heading"
          >
            <div>
              <h2 id="review-decision-heading">
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
                disabled={statusUpdating}
                onClick={() =>
                  updateStatus("Verified")
                }
              >
                {statusUpdating
                  ? "Saving..."
                  : "✓ Verify Report"}
              </button>

              <button
                className="danger-btn"
                type="button"
                disabled={statusUpdating}
                onClick={() =>
                  updateStatus("Rejected")
                }
              >
                Reject Report
              </button>

              <button
                className="outline-btn"
                type="button"
                disabled={statusUpdating}
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
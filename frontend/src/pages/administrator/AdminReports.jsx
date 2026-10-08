import { useEffect, useState } from "react";
import FeedbackMessage from "../../components/FeedbackMessage";
import ModalDialog from "../../components/ModalDialog";

const ENDORSED_STATUS = "Endorsed to Engineering Office";

export default function AdminReports({
  reports,
  onUpdateReport,
  administrator,
}) {
  const [selectedReport, setSelectedReport] =
    useState(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [pendingStatus, setPendingStatus] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [generatedPdfAt, setGeneratedPdfAt] = useState("");
  const [selectedReportIds, setSelectedReportIds] = useState([]);
  const [selectedPrintReports, setSelectedPrintReports] = useState(null);
  const [pendingEndorsement, setPendingEndorsement] = useState(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!selectedPrintReports) return undefined;

    function handleAfterPrint() {
      setSelectedPrintReports(null);
      setPendingEndorsement((current) => (
        current ? { ...current, phase: "printed" } : null
      ));
    }
    window.addEventListener("afterprint", handleAfterPrint, { once: true });
    const printTimeout = window.setTimeout(() => window.print(), 100);
    return () => {
      window.clearTimeout(printTimeout);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [selectedPrintReports]);

  const inspectedReports = reports.filter(
    (report) =>
      Boolean(report.inspectedAt) ||
      ["Verified"].includes(report.status)
  );
  const reportReviewRecords = inspectedReports.filter(
    (report) => report.status !== ENDORSED_STATUS && !(report.status === "Closed" && report.endorsedAt)
  );

  const visibleReports = reportReviewRecords
    .filter((report) => {
      const query = search.trim().toLowerCase();
      return (
        !query ||
        [report.id, report.issue, report.location, report.priority]
          .some((value) =>
            String(value || "").toLowerCase().includes(query)
          )
      );
    })
    .sort((left, right) => {
      const leftValue =
        sortBy === "priority"
          ? left.priority
          : sortBy === "issue"
            ? left.issue
            : left.inspectedAt || "";
      const rightValue =
        sortBy === "priority"
          ? right.priority
          : sortBy === "issue"
            ? right.issue
            : right.inspectedAt || "";
      const comparison = String(leftValue).localeCompare(
        String(rightValue),
        undefined,
        { numeric: true }
      );
      return sortDirection === "asc" ? comparison : -comparison;
    });
  const selectableVisibleReports = visibleReports.filter(
    (report) => report.status === "Verified"
  );
  const selectedVerifiedReports = reports.filter(
    (report) => selectedReportIds.includes(report.id) && report.status === "Verified"
  );
  const allVisibleReportsSelected = selectableVisibleReports.length > 0 &&
    selectableVisibleReports.every((report) => selectedReportIds.includes(report.id));

  function getAllowedStatusOptions(report) {
    if (!report) return [];

    if (report.status === "Verified") {
      return [
        "Verified",
        ENDORSED_STATUS,
      ];
    }

    if (report.status === ENDORSED_STATUS) {
      return [ENDORSED_STATUS];
    }

    return [report.status];
  }

  function changeStatus(status) {
    if (!selectedReport || !getAllowedStatusOptions(selectedReport).includes(status)) {
      return;
    }

    if (status === selectedReport.status) {
      return;
    }
    setPendingStatus(status);
  }

  async function confirmStatusChange() {
    if (!selectedReport || !pendingStatus || statusUpdating) {
      return;
    }

    const allowedStatusOptions = getAllowedStatusOptions(selectedReport);
    if (!allowedStatusOptions.includes(pendingStatus)) {
      return;
    }

    if (pendingStatus === ENDORSED_STATUS) {
      startEndorsementPrint([selectedReport], new Date().toISOString());
      setPendingStatus("");
      setSelectedReport(null);
      return;
    }

    setStatusUpdating(true);
    try {
      const updatedReport = await onUpdateReport(selectedReport.id, pendingStatus, {
        statusChangedAt: new Date().toISOString(),
      });
      if (!updatedReport) return;
      setPendingStatus("");
      setSelectedReport(null);
    } finally {
      setStatusUpdating(false);
    }
  }

  function closeReportModal() {
    setPendingStatus("");
    setSelectedReport(null);
  }

  function generatePdf(report) {
    setSelectedPrintReports(null);
    setGeneratedPdfAt(new Date().toISOString());
    setSelectedReport(report);

    setTimeout(() => {
      window.print();
    }, 100);
  }

  function startEndorsementPrint(reportsToEndorse, generatedAt) {
    const administratorName = administrator?.name ||
      `${administrator?.firstName || ""} ${administrator?.lastName || ""}`.trim() ||
      administrator?.email ||
      "Administrator";
    const printReports = reportsToEndorse.map((report) => ({
      ...report,
      status: ENDORSED_STATUS,
      endorsedTo: "Engineering Office",
      endorsedAt: generatedAt,
      endorsedBy: administratorName,
      reportGeneratedAt: generatedAt,
    }));

    setPendingEndorsement({
      reports: reportsToEndorse,
      generatedAt,
      phase: "printing",
    });
    setPendingStatus("");
    setGeneratedPdfAt(generatedAt);
    setSelectedReport(null);
    setSelectedPrintReports(printReports);
  }

  async function confirmEndorsementAfterPrint() {
    if (!pendingEndorsement || pendingEndorsement.phase !== "printed" || bulkUpdating) {
      return;
    }

    setBulkUpdating(true);
    try {
      const results = await Promise.all(pendingEndorsement.reports.map(async (report) => ({
        report,
        result: await onUpdateReport(report.id, ENDORSED_STATUS, {
          statusChangedAt: new Date().toISOString(),
          reportGeneratedAt: pendingEndorsement.generatedAt,
        }),
      })));
      const failedReports = results.filter(({ result }) => !result);
      const endorsedReports = results
        .filter(({ result }) => result)
        .map(({ result }) => result);
      const succeededIds = endorsedReports.map((report) => report.id);

      setSelectedReportIds((currentIds) => currentIds.filter((id) => !succeededIds.includes(id)));
      if (failedReports.length) {
        setPendingEndorsement((current) => ({
          ...current,
          reports: failedReports.map(({ report }) => report),
        }));
        setFeedback(
          `${failedReports.length} report(s) could not be endorsed. ` +
          `You can retry: ${failedReports.map(({ report }) => report.id).join(", ")}.`
        );
      } else {
        setPendingEndorsement(null);
      }
    } finally {
      setBulkUpdating(false);
    }
  }

  function toggleReportSelection(reportId) {
    setSelectedReportIds((currentIds) => (
      currentIds.includes(reportId)
        ? currentIds.filter((id) => id !== reportId)
        : [...currentIds, reportId]
    ));
  }

  function toggleSelectAllVisible() {
    const visibleIds = selectableVisibleReports.map((report) => report.id);
    if (allVisibleReportsSelected) {
      setSelectedReportIds((currentIds) => currentIds.filter((id) => !visibleIds.includes(id)));
      return;
    }
    setSelectedReportIds((currentIds) => [...new Set([...currentIds, ...visibleIds])]);
  }

  async function generateAndEndorseSelected() {
    if (bulkUpdating || pendingEndorsement) return;
    const reportsToGenerate = selectedVerifiedReports;
    if (!reportsToGenerate.length) {
      setFeedback("Select at least one verified report to generate and endorse.");
      return;
    }

    setPendingEndorsement({
      reports: reportsToGenerate,
      generatedAt: new Date().toISOString(),
      phase: "confirm",
    });
  }

  return (
    <main className="main">

      <div className="admin-page no-print">
        <FeedbackMessage
          message={feedback}
          onDismiss={() => setFeedback("")}
        />
        <p className="eyebrow">
          ADMINISTRATION
        </p>

        <h1>Inspected Reports</h1>

        <p className="subtitle">
          Review verified inspection reports and
          system activity.
        </p>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                INSPECTION RECORDS
              </p>

              <h2>Inspected Reports</h2>

              <p>
                Review verified inspector decisions,
                search records, and generate PDFs.
              </p>
            </div>

            <span className="section-count">
              {visibleReports.length} Inspected
            </span>
          </div>

          <div className="report-filter-form">
            <label>
              Search
              <input
                type="search"
                placeholder="ID, issue, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search reports"
              />
            </label>
            <label>
              Sort by
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort inspected reports by"
              >
                <option value="date">Reviewed date</option>
                <option value="priority">Priority</option>
                <option value="issue">Issue</option>
              </select>
            </label>
            <button
              className="outline-btn"
              onClick={() =>
                setSortDirection((direction) =>
                  direction === "asc" ? "desc" : "asc"
                )
              }
            >
              {sortDirection === "asc" ? "Ascending" : "Descending"}
            </button>
          </div>

          <div className="bulk-report-actions">
            <label className="select-all-reports">
              <input
                type="checkbox"
                checked={allVisibleReportsSelected}
                onChange={toggleSelectAllVisible}
                disabled={!selectableVisibleReports.length || bulkUpdating}
              />
              Select all verified reports shown ({selectableVisibleReports.length})
            </label>
            <button
              className="gold"
              type="button"
              onClick={generateAndEndorseSelected}
              disabled={!selectedVerifiedReports.length || bulkUpdating || Boolean(pendingEndorsement)}
            >
              {bulkUpdating
                ? "Generating and endorsing..."
                : `Generate PDF & Endorse Selected (${selectedVerifiedReports.length})`}
            </button>
          </div>

          {visibleReports.length === 0 ? (
            <div className="empty-state">
              <p>
                {inspectedReports.length === 0
                  ? "No inspected reports yet."
                  : "No reports match your search."}
              </p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table admin-report-table">
                <thead>
                  <tr>
                    <th className="report-select-column">Select</th>
                    <th>Report ID</th>
                    <th>Issue</th>
                    <th>Location</th>
                    <th>Inspector</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Reviewed</th>
                    <th className="admin-report-action-column">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleReports.map((report) => (
                    <tr key={report.id}>
                      <td className="report-select-column">
                        <input
                          type="checkbox"
                          aria-label={`Select report ${report.id}`}
                          checked={selectedReportIds.includes(report.id)}
                          onChange={() => toggleReportSelection(report.id)}
                          disabled={report.status !== "Verified" || bulkUpdating}
                        />
                      </td>
                      <td>
                        <strong>{report.id}</strong>
                      </td>

                      <td>{report.issue}</td>
                      <td>{report.location}</td>

                      <td>
                        {report.inspectedBy ||
                          report.verifiedBy ||
                          "Not assigned"}
                      </td>

                      <td>
                        <span
                          className={`priority priority-${report.priority.toLowerCase()}`}
                        >
                          {report.priority}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`status status-${report.status
                            .toLowerCase()
                            .replaceAll(" ", "-")}`}
                        >
                          {report.status}
                        </span>
                      </td>

                      <td>
                        {report.inspectedAt
                          ? new Date(
                              report.inspectedAt
                            ).toLocaleDateString()
                          : "Not available"}
                      </td>

                      <td className="admin-report-action-column">
                        <button
                          className="outline-btn small-btn"
                          onClick={() => {
                            setSelectedReport(report);
                          }}
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selectedReport && !pendingStatus && (
          <ModalDialog
            className="report-preview"
            overlayClassName="no-print"
            labelledBy="report-preview-title"
            onClose={closeReportModal}
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  INSPECTION REPORT
                </p>

                <h2 id="report-preview-title">
                  {selectedReport.id} â€”{" "}
                  {selectedReport.issue}
                </h2>
              </div>

              <div className="action-buttons">
                <button
                  className="gold"
                  onClick={() => generatePdf(selectedReport)}
                >
                  Generate PDF
                </button>
                <button
                  className="outline-btn"
                  onClick={closeReportModal}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="detail-list">
              <p>
                <strong>Reporter:</strong>
                {selectedReport.reporter}
              </p>

              <p>
                <strong>Location:</strong>
                {selectedReport.location}
              </p>

              <p>
                <strong>Inspector:</strong>
                {selectedReport.inspectedBy ||
                  selectedReport.verifiedBy ||
                  "Not assigned"}
              </p>

              <p>
                <strong>Status:</strong>
                {selectedReport.status}
              </p>

              <p>
                <strong>Priority:</strong>
                {selectedReport.priority}
              </p>

              <p>
                <strong>Notes:</strong>
                {selectedReport.verificationNotes ||
                  "No inspection notes provided."}
              </p>
              {selectedReport.endorsedAt && (
                <>
                  <p>
                    <strong>Endorsed to:</strong>
                    {selectedReport.endorsedTo || "Engineering Office"}
                  </p>
                  <p>
                    <strong>Endorsed on:</strong>
                    {new Date(selectedReport.endorsedAt).toLocaleString()}
                  </p>
                </>
              )}
            </div>
            {getAllowedStatusOptions(selectedReport).length > 1 && (
              <label>
                {selectedReport.status === ENDORSED_STATUS ? "Close Report" : "Next Status"}
                <select
                  value={selectedReport.status}
                  onChange={(e) => changeStatus(e.target.value)}
                >
                  {getAllowedStatusOptions(selectedReport).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </ModalDialog>
        )}

        {pendingStatus && selectedReport && (
          <ModalDialog
            className="confirmation-modal"
            overlayClassName="no-print"
            role="alertdialog"
            labelledBy="status-confirmation-title"
            onClose={() => {
              if (!statusUpdating) setPendingStatus("");
            }}
          >
              <div className="warning-icon">!</div>
              <h2 id="status-confirmation-title">
                Confirm Status Change
              </h2>
              <p>
                Change report <strong>{selectedReport.id}</strong>{" "}
                from <strong>{selectedReport.status}</strong> to{" "}
                <strong>{pendingStatus}</strong>?
              </p>
              {pendingStatus === ENDORSED_STATUS && (
                <p>
                  The inspection report PDF must be printed or saved before the report status is updated. You will be asked to confirm after the print dialog closes.
                </p>
              )}
              {pendingStatus === "Closed" && selectedReport.status === ENDORSED_STATUS && (
                <p>Confirm that the endorsed case has been completed before closing it.</p>
              )}
              <div className="action-buttons">
                <button
                  className="outline-btn"
                  onClick={() => setPendingStatus("")}
                  disabled={statusUpdating}
                >
                  Cancel
                </button>
                <button
                  className="gold"
                  onClick={confirmStatusChange}
                  disabled={statusUpdating}
                >
                  {statusUpdating
                    ? "Saving..."
                    : pendingStatus === ENDORSED_STATUS
                      ? "Generate PDF"
                      : "Confirm Change"}
                </button>
              </div>
          </ModalDialog>
        )}

        {pendingEndorsement && ["confirm", "printed"].includes(pendingEndorsement.phase) && (
          <ModalDialog
            className="confirmation-modal"
            overlayClassName="no-print"
            role="alertdialog"
            labelledBy="endorsement-confirmation-title"
            onClose={() => {
              if (!bulkUpdating) setPendingEndorsement(null);
            }}
          >
              <div className="warning-icon">!</div>
              <h2 id="endorsement-confirmation-title">
                {pendingEndorsement.phase === "confirm"
                  ? "Generate Endorsement PDF?"
                  : "Confirm PDF Was Printed"}
              </h2>
              {pendingEndorsement.phase === "confirm" ? (
                <p>
                  Generate the PDF for {pendingEndorsement.reports.length} selected report(s) first. Their status will only be updated after you confirm that you printed or saved the PDF.
                </p>
              ) : (
                <p>
                  If you printed or saved the PDF, confirm to endorse{" "}
                  {pendingEndorsement.reports.length} report(s). If you canceled the print dialog or did not save the PDF, choose Cancel; no status will be changed.
                </p>
              )}
              <div className="action-buttons">
                <button
                  className="outline-btn"
                  onClick={() => setPendingEndorsement(null)}
                  disabled={bulkUpdating}
                >
                  Cancel
                </button>
                {pendingEndorsement.phase === "confirm" ? (
                  <button
                    className="gold"
                    onClick={() => startEndorsementPrint(
                      pendingEndorsement.reports,
                      pendingEndorsement.generatedAt
                    )}
                    disabled={bulkUpdating}
                  >
                    Generate PDF
                  </button>
                ) : (
                  <button
                    className="gold"
                    onClick={confirmEndorsementAfterPrint}
                    disabled={bulkUpdating}
                  >
                    {bulkUpdating
                      ? "Updating..."
                      : pendingEndorsement.reports.length > 1
                        ? "PDF Printed — Endorse Reports"
                        : "PDF Printed — Endorse Report"}
                  </button>
                )}
              </div>
          </ModalDialog>
        )}

      </div>

      {selectedPrintReports && (
        <section className="printable-report selected-printable-report">
          <header className="bulk-print-header">
            <p className="eyebrow">ROADWATCH · PUBLIC INFRASTRUCTURE MONITOR</p>
            <h1>Inspection &amp; Engineering Endorsement Report</h1>
            <table className="pdf-meta-table">
              <tbody>
                <tr>
                  <th>Document generated</th>
                  <td>{new Date(generatedPdfAt).toLocaleString()}</td>
                  <th>Reports included</th>
                  <td>{selectedPrintReports.length}</td>
                </tr>
              </tbody>
            </table>
          </header>
          {selectedPrintReports.map((report, index) => (
            <article className="selected-print-report" key={report.id}>
              <h2>{index + 1}. {report.issue}</h2>
              <table className="pdf-report-table">
                <tbody>
                  <tr><th colSpan="2">Report Information</th></tr>
                  <tr><th>Report ID</th><td>{report.id}</td></tr>
                  <tr><th>Reporter</th><td>{report.reporter || "Not available"}</td></tr>
                  <tr><th>Location</th><td>{report.location}</td></tr>
                  <tr><th>Category</th><td>{report.category || report.issue}</td></tr>
                  <tr><th>Priority</th><td>{report.priority}</td></tr>
                  <tr><th>Inspector</th><td>{report.inspectedBy || report.verifiedBy || "Not assigned"}</td></tr>
                  <tr>
                    <th>Inspection date</th>
                    <td>{report.inspectedAt ? new Date(report.inspectedAt).toLocaleString() : "Not available"}</td>
                  </tr>
                  <tr><th>Status</th><td>{report.status}</td></tr>
                  <tr><th>Issue description</th><td className="pdf-long-text">{report.description || "No description provided."}</td></tr>
                  <tr><th>Inspector findings</th><td className="pdf-long-text">{report.verificationNotes || "No inspection notes provided."}</td></tr>
                </tbody>
              </table>
              <table className="pdf-report-table pdf-endorsement-table">
                <tbody>
                  <tr><th colSpan="2">Engineering Office Endorsement</th></tr>
                  <tr><th>Endorsed to</th><td>{report.endorsedTo || "Engineering Office"}</td></tr>
                  <tr>
                    <th>Endorsed by</th>
                    <td>{report.endorsedBy || administrator?.name || `${administrator?.firstName || ""} ${administrator?.lastName || ""}`.trim() || "Administrator"}</td>
                  </tr>
                  <tr>
                    <th>Date endorsed</th>
                    <td>{report.endorsedAt ? new Date(report.endorsedAt).toLocaleString() : "Not available"}</td>
                  </tr>
                  {report.endorsementReference && (
                    <tr><th>Outgoing reference</th><td>{report.endorsementReference}</td></tr>
                  )}
                  <tr>
                    <th>Purpose</th>
                    <td className="pdf-long-text">Submitted for Engineering Office review and appropriate action.</td>
                  </tr>
                </tbody>
              </table>
            </article>
          ))}
        </section>
      )}

      {selectedReport && (
        <section className="printable-report">
          <p className="eyebrow">
            ROADWATCH INSPECTION & ENDORSEMENT REPORT
          </p>

          <h1>
            {selectedReport.issue}
          </h1>

          <p>Report ID: {selectedReport.id}</p>

          <div className="print-report-grid">
            <p>
              <strong>Reporter:</strong>{" "}
              {selectedReport.reporter}
            </p>
            <p>
              <strong>Location:</strong>{" "}
              {selectedReport.location}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              {selectedReport.status}
            </p>
            <p>
              <strong>Priority:</strong>{" "}
              {selectedReport.priority}
            </p>
            <p>
              <strong>Inspector:</strong>{" "}
              {selectedReport.inspectedBy ||
                selectedReport.verifiedBy ||
                "Not assigned"}
            </p>
            <p>
              <strong>Reviewed:</strong>{" "}
              {selectedReport.inspectedAt
                ? new Date(
                    selectedReport.inspectedAt
                  ).toLocaleString()
                : "Not available"}
            </p>
          </div>

          <h2>Description</h2>
          <p>{selectedReport.description}</p>

          <h2>Inspection Notes</h2>
          <p>
            {selectedReport.verificationNotes ||
              "No inspection notes provided."}
          </p>
          {selectedReport.endorsedAt && (
            <>
              <h2>Endorsement Record</h2>
              <p>
                <strong>Endorsed to:</strong>{" "}
                {selectedReport.endorsedTo || "Engineering Office"}
              </p>
              <p>
                <strong>Endorsed by:</strong>{" "}
                {selectedReport.endorsedBy || administrator?.name || `${administrator?.firstName || ""} ${administrator?.lastName || ""}`.trim() || "Administrator"}
              </p>
              <p>
                <strong>Date endorsed:</strong>{" "}
                {new Date(selectedReport.endorsedAt).toLocaleString()}
              </p>
              {selectedReport.endorsementReference && (
                <p>
                  <strong>Outgoing reference:</strong>{" "}
                  {selectedReport.endorsementReference}
                </p>
              )}
            </>
          )}
        </section>
      )}

    </main>
  );
}

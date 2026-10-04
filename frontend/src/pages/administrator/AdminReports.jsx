import { useEffect, useState } from "react";

const ENDORSED_STATUS = "Endorsed to Engineering Office";

export default function AdminReports({
  reports,
  onUpdateReport,
  administrator,
}) {
  const [selectedReport, setSelectedReport] = useState(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [pendingStatus, setPendingStatus] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [generatedPdfAt, setGeneratedPdfAt] = useState("");
  const [selectedReportIds, setSelectedReportIds] = useState([]);
  const [selectedPrintReports, setSelectedPrintReports] = useState(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [bulkSuccess, setBulkSuccess] = useState("");

  useEffect(() => {
    if (!selectedPrintReports) {
      return undefined;
    }

    function clearPrintReport() {
      setSelectedPrintReports(null);
    }

    window.addEventListener(
      "afterprint",
      clearPrintReport,
      { once: true }
    );

    window.print();

    return () =>
      window.removeEventListener(
        "afterprint",
        clearPrintReport
      );
  }, [selectedPrintReports]);

  const inspectedReports = reports.filter(
    (report) =>
      Boolean(report.inspectedAt) ||
      report.status === "Verified"
  );

  const reportReviewRecords = inspectedReports.filter(
    (report) =>
      report.status !== ENDORSED_STATUS &&
      !(
        report.status === "Closed" &&
        report.endorsedAt
      )
  );

  const visibleReports = reportReviewRecords
    .filter((report) => {
      const query = search.trim().toLowerCase();

      return (
        !query ||
        [
          report.id,
          report.issue,
          report.location,
          report.priority,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query)
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

      return sortDirection === "asc"
        ? comparison
        : -comparison;
    });

  const selectableVisibleReports = visibleReports.filter(
    (report) => report.status === "Verified"
  );

  const selectedVerifiedReports = reports.filter(
    (report) =>
      selectedReportIds.includes(report.id) &&
      report.status === "Verified"
  );

  const allVisibleReportsSelected =
    selectableVisibleReports.length > 0 &&
    selectableVisibleReports.every((report) =>
      selectedReportIds.includes(report.id)
    );

  function getAllowedStatusOptions(report) {
    if (!report) {
      return [];
    }

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
    if (
      !selectedReport ||
      !getAllowedStatusOptions(
        selectedReport
      ).includes(status)
    ) {
      return;
    }

    if (status === selectedReport.status) {
      return;
    }

    setPendingStatus(status);
  }

  async function confirmStatusChange() {
    if (
      !selectedReport ||
      !pendingStatus ||
      statusUpdating
    ) {
      return;
    }

    const allowedStatusOptions =
      getAllowedStatusOptions(selectedReport);

    if (!allowedStatusOptions.includes(pendingStatus)) {
      return;
    }

    setStatusUpdating(true);

    try {
      const reportGeneratedAt =
        pendingStatus === ENDORSED_STATUS
          ? new Date().toISOString()
          : "";

      const updatedReport = await onUpdateReport(
        selectedReport.id,
        pendingStatus,
        {
          statusChangedAt: new Date().toISOString(),
          ...(pendingStatus === ENDORSED_STATUS
            ? {
                reportGeneratedAt,
              }
            : {}),
        }
      );

      if (!updatedReport) {
        return;
      }

      setPendingStatus("");
      setSelectedReport(null);

      if (pendingStatus === ENDORSED_STATUS) {
        setGeneratedPdfAt(reportGeneratedAt);
        setSelectedPrintReports([updatedReport]);
      }
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

  function toggleReportSelection(reportId) {
    setBulkError("");
    setBulkSuccess("");

    setSelectedReportIds((currentIds) =>
      currentIds.includes(reportId)
        ? currentIds.filter(
            (id) => id !== reportId
          )
        : [...currentIds, reportId]
    );
  }

  function toggleSelectAllVisible() {
    setBulkError("");
    setBulkSuccess("");

    const visibleIds =
      selectableVisibleReports.map(
        (report) => report.id
      );

    if (allVisibleReportsSelected) {
      setSelectedReportIds((currentIds) =>
        currentIds.filter(
          (id) => !visibleIds.includes(id)
        )
      );

      return;
    }

    setSelectedReportIds((currentIds) => [
      ...new Set([
        ...currentIds,
        ...visibleIds,
      ]),
    ]);
  }

  async function generateAndEndorseSelected() {
    if (bulkUpdating) {
      return;
    }

    setBulkError("");
    setBulkSuccess("");

    const reportsToGenerate =
      selectedVerifiedReports;

    if (!reportsToGenerate.length) {
      setBulkError(
        "Select at least one verified report to generate and endorse."
      );
      return;
    }

    const reportGeneratedAt =
      new Date().toISOString();

    setBulkUpdating(true);
    setSelectedReport(null);
    setGeneratedPdfAt(reportGeneratedAt);

    try {
      const results = await Promise.all(
        reportsToGenerate.map(
          async (report) => ({
            report,
            result: await onUpdateReport(
              report.id,
              ENDORSED_STATUS,
              {
                reportGeneratedAt,
              }
            ),
          })
        )
      );

      const failedReports = results.filter(
        ({ result }) => !result
      );

      const endorsedReports = results
        .filter(({ result }) => result)
        .map(({ result }) => result);

      const succeededIds =
        endorsedReports.map(
          (report) => report.id
        );

      setSelectedReportIds((currentIds) =>
        currentIds.filter(
          (id) => !succeededIds.includes(id)
        )
      );

      setSelectedPrintReports(
        endorsedReports.length
          ? endorsedReports
          : null
      );

      if (failedReports.length) {
        const failedIds = failedReports
          .map(({ report }) => report.id)
          .join(", ");

        setBulkError(
          `${failedReports.length} report(s) could not be endorsed. You can retry: ${failedIds}.`
        );
      } else {
        setBulkSuccess(
          `${endorsedReports.length} report(s) successfully endorsed. The PDF is being generated.`
        );
      }
    } finally {
      setBulkUpdating(false);
    }
  }

  return (
    <main className="main">
      <div className="admin-page no-print">
        <p className="eyebrow">
          ADMINISTRATION
        </p>

        <h1>Inspected Reports</h1>

        <p className="subtitle">
          Review verified inspection reports and
          system activity.
        </p>

        <section
          className="panel"
          aria-labelledby="inspected-reports-heading"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                INSPECTION RECORDS
              </p>

              <h2 id="inspected-reports-heading">
                Inspected Reports
              </h2>

              <p>
                Review verified inspector decisions,
                search records, and generate PDFs.
              </p>
            </div>

            <span
              className="section-count"
              aria-live="polite"
            >
              {visibleReports.length} Inspected
            </span>
          </div>

          <div className="report-filter-form">
            <div>
              <label htmlFor="admin-report-search">
                Search
              </label>

              <input
                id="admin-report-search"
                name="reportSearch"
                type="search"
                placeholder="ID, issue, location..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            <div>
              <label htmlFor="admin-report-sort">
                Sort by
              </label>

              <select
                id="admin-report-sort"
                name="reportSort"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value)
                }
              >
                <option value="date">
                  Reviewed date
                </option>

                <option value="priority">
                  Priority
                </option>

                <option value="issue">
                  Issue
                </option>
              </select>
            </div>

            <button
              className="outline-btn"
              type="button"
              aria-label={`Sort ${
                sortDirection === "asc"
                  ? "descending"
                  : "ascending"
              }`}
              onClick={() =>
                setSortDirection(
                  (direction) =>
                    direction === "asc"
                      ? "desc"
                      : "asc"
                )
              }
            >
              {sortDirection === "asc"
                ? "Ascending"
                : "Descending"}
            </button>
          </div>

          <div className="bulk-report-actions">
            <label className="select-all-reports">
              <input
                type="checkbox"
                checked={
                  allVisibleReportsSelected
                }
                onChange={
                  toggleSelectAllVisible
                }
                disabled={
                  !selectableVisibleReports.length ||
                  bulkUpdating
                }
              />

              Select all verified reports shown (
              {selectableVisibleReports.length})
            </label>

            <button
              className="gold"
              type="button"
              onClick={
                generateAndEndorseSelected
              }
              disabled={
                !selectedVerifiedReports.length ||
                bulkUpdating
              }
            >
              {bulkUpdating
                ? "Generating and endorsing..."
                : `Generate PDF & Endorse Selected (${selectedVerifiedReports.length})`}
            </button>
          </div>

          {bulkError && (
            <div
              className="login-error admin-report-feedback"
              role="alert"
              aria-live="assertive"
            >
              <span
                className="login-error-icon"
                aria-hidden="true"
              >
                ⚠
              </span>

              <span>{bulkError}</span>
            </div>
          )}

          {bulkSuccess && (
            <div
              className="admin-form-success admin-report-feedback"
              role="status"
              aria-live="polite"
            >
              <span aria-hidden="true">
                ✓
              </span>

              <span>{bulkSuccess}</span>
            </div>
          )}

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
                <caption className="sr-only">
                  Inspected RoadWatch reports
                </caption>

                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="report-select-column"
                    >
                      Select
                    </th>

                    <th scope="col">
                      Report ID
                    </th>

                    <th scope="col">
                      Issue
                    </th>

                    <th scope="col">
                      Location
                    </th>

                    <th scope="col">
                      Inspector
                    </th>

                    <th scope="col">
                      Priority
                    </th>

                    <th scope="col">
                      Status
                    </th>

                    <th scope="col">
                      Reviewed
                    </th>

                    <th scope="col">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visibleReports.map(
                    (report) => (
                      <tr key={report.id}>
                        <td className="report-select-column">
                          <input
                            type="checkbox"
                            aria-label={`Select report ${report.id}`}
                            checked={selectedReportIds.includes(
                              report.id
                            )}
                            onChange={() =>
                              toggleReportSelection(
                                report.id
                              )
                            }
                            disabled={
                              report.status !==
                                "Verified" ||
                              bulkUpdating
                            }
                          />
                        </td>

                        <td>
                          <strong>
                            {report.id}
                          </strong>
                        </td>

                        <td>
                          {report.issue}
                        </td>

                        <td>
                          {report.location}
                        </td>

                        <td>
                          {report.inspectedBy ||
                            report.verifiedBy ||
                            "Not assigned"}
                        </td>

                        <td>
                          <span
                            className={`priority priority-${String(
                              report.priority ||
                                ""
                            ).toLowerCase()}`}
                          >
                            {report.priority}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`status status-${String(
                              report.status ||
                                ""
                            )
                              .toLowerCase()
                              .replaceAll(
                                " ",
                                "-"
                              )}`}
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

                        <td>
                          <button
                            className="outline-btn small-btn"
                            type="button"
                            onClick={() => {
                              setPendingStatus(
                                ""
                              );
                              setSelectedReport(
                                report
                              );
                            }}
                          >
                            View Report
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selectedReport && (
          <div className="modal-overlay no-print">
            <section
              className="modal report-preview"
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-report-preview-title"
            >
              <div className="section-heading">
                <div>
                  <p className="eyebrow">
                    INSPECTION REPORT
                  </p>

                  <h2 id="admin-report-preview-title">
                    {selectedReport.id} —{" "}
                    {selectedReport.issue}
                  </h2>
                </div>

                <div className="action-buttons">
                  <button
                    className="gold"
                    type="button"
                    onClick={() =>
                      generatePdf(
                        selectedReport
                      )
                    }
                  >
                    Generate PDF
                  </button>

                  <button
                    className="outline-btn"
                    type="button"
                    onClick={
                      closeReportModal
                    }
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="detail-list">
                <p>
                  <strong>
                    Reporter:
                  </strong>{" "}
                  {selectedReport.reporter}
                </p>

                <p>
                  <strong>
                    Location:
                  </strong>{" "}
                  {selectedReport.location}
                </p>

                <p>
                  <strong>
                    Inspector:
                  </strong>{" "}
                  {selectedReport.inspectedBy ||
                    selectedReport.verifiedBy ||
                    "Not assigned"}
                </p>

                <p>
                  <strong>
                    Status:
                  </strong>{" "}
                  {selectedReport.status}
                </p>

                <p>
                  <strong>
                    Priority:
                  </strong>{" "}
                  {selectedReport.priority}
                </p>

                <p>
                  <strong>
                    Notes:
                  </strong>{" "}
                  {selectedReport.verificationNotes ||
                    "No inspection notes provided."}
                </p>

                {selectedReport.endorsedAt && (
                  <>
                    <p>
                      <strong>
                        Endorsed to:
                      </strong>{" "}
                      {selectedReport.endorsedTo ||
                        "Engineering Office"}
                    </p>

                    <p>
                      <strong>
                        Endorsed on:
                      </strong>{" "}
                      {new Date(
                        selectedReport.endorsedAt
                      ).toLocaleString()}
                    </p>
                  </>
                )}
              </div>

              {getAllowedStatusOptions(
                selectedReport
              ).length > 1 && (
                <div>
                  <label htmlFor="admin-report-next-status">
                    {selectedReport.status ===
                    ENDORSED_STATUS
                      ? "Close Report"
                      : "Next Status"}
                  </label>

                  <select
                    id="admin-report-next-status"
                    value={
                      selectedReport.status
                    }
                    onChange={(event) =>
                      changeStatus(
                        event.target.value
                      )
                    }
                  >
                    {getAllowedStatusOptions(
                      selectedReport
                    ).map((status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </section>
          </div>
        )}

        {pendingStatus && selectedReport && (
          <div className="modal-overlay no-print">
            <section
              className="modal confirmation-modal"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="status-confirmation-title"
            >
              <div
                className="warning-icon"
                aria-hidden="true"
              >
                !
              </div>

              <h2 id="status-confirmation-title">
                Confirm Status Change
              </h2>

              <p>
                Change report{" "}
                <strong>
                  {selectedReport.id}
                </strong>{" "}
                from{" "}
                <strong>
                  {selectedReport.status}
                </strong>{" "}
                to{" "}
                <strong>
                  {pendingStatus}
                </strong>
                ?
              </p>

              {pendingStatus ===
                ENDORSED_STATUS && (
                <p>
                  Confirm endorsement to the
                  Engineering Office. The
                  inspection report PDF will be
                  generated after confirmation.
                </p>
              )}

              {pendingStatus === "Closed" &&
                selectedReport.status ===
                  ENDORSED_STATUS && (
                  <p>
                    Confirm that the endorsed
                    case has been completed
                    before closing it.
                  </p>
                )}

              <div className="action-buttons">
                <button
                  className="outline-btn"
                  type="button"
                  onClick={() =>
                    setPendingStatus("")
                  }
                  disabled={statusUpdating}
                >
                  Cancel
                </button>

                <button
                  className="gold"
                  type="button"
                  onClick={
                    confirmStatusChange
                  }
                  disabled={statusUpdating}
                >
                  {statusUpdating
                    ? "Saving..."
                    : "Confirm Change"}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>

      {selectedPrintReports && (
        <section className="printable-report selected-printable-report">
          <header className="bulk-print-header">
            <p className="eyebrow">
              ROADWATCH · PUBLIC INFRASTRUCTURE
              MONITOR
            </p>

            <h1>
              Inspection &amp; Engineering
              Endorsement Report
            </h1>

            <table className="pdf-meta-table">
              <tbody>
                <tr>
                  <th scope="row">
                    Document generated
                  </th>

                  <td>
                    {new Date(
                      generatedPdfAt
                    ).toLocaleString()}
                  </td>

                  <th scope="row">
                    Reports included
                  </th>

                  <td>
                    {
                      selectedPrintReports.length
                    }
                  </td>
                </tr>
              </tbody>
            </table>
          </header>

          {selectedPrintReports.map(
            (report, index) => (
              <article
                className="selected-print-report"
                key={report.id}
              >
                <h2>
                  {index + 1}.{" "}
                  {report.issue}
                </h2>

                <table className="pdf-report-table">
                  <tbody>
                    <tr>
                      <th colSpan="2">
                        Report Information
                      </th>
                    </tr>

                    <tr>
                      <th scope="row">
                        Report ID
                      </th>
                      <td>{report.id}</td>
                    </tr>

                    <tr>
                      <th scope="row">
                        Reporter
                      </th>
                      <td>
                        {report.reporter ||
                          "Not available"}
                      </td>
                    </tr>

                    <tr>
                      <th scope="row">
                        Location
                      </th>
                      <td>
                        {report.location}
                      </td>
                    </tr>

                    <tr>
                      <th scope="row">
                        Category
                      </th>
                      <td>
                        {report.category ||
                          report.issue}
                      </td>
                    </tr>

                    <tr>
                      <th scope="row">
                        Priority
                      </th>
                      <td>
                        {report.priority}
                      </td>
                    </tr>

                    <tr>
                      <th scope="row">
                        Inspector
                      </th>
                      <td>
                        {report.inspectedBy ||
                          report.verifiedBy ||
                          "Not assigned"}
                      </td>
                    </tr>

                    <tr>
                      <th scope="row">
                        Inspection date
                      </th>
                      <td>
                        {report.inspectedAt
                          ? new Date(
                              report.inspectedAt
                            ).toLocaleString()
                          : "Not available"}
                      </td>
                    </tr>

                    <tr>
                      <th scope="row">
                        Status
                      </th>
                      <td>
                        {report.status}
                      </td>
                    </tr>

                    <tr>
                      <th scope="row">
                        Issue description
                      </th>
                      <td className="pdf-long-text">
                        {report.description ||
                          "No description provided."}
                      </td>
                    </tr>

                    <tr>
                      <th scope="row">
                        Inspector findings
                      </th>
                      <td className="pdf-long-text">
                        {report.verificationNotes ||
                          "No inspection notes provided."}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <table className="pdf-report-table pdf-endorsement-table">
                  <tbody>
                    <tr>
                      <th colSpan="2">
                        Engineering Office
                        Endorsement
                      </th>
                    </tr>

                    <tr>
                      <th scope="row">
                        Endorsed to
                      </th>
                      <td>
                        {report.endorsedTo ||
                          "Engineering Office"}
                      </td>
                    </tr>

                    <tr>
                      <th scope="row">
                        Endorsed by
                      </th>

                      <td>
                        {report.endorsedBy ||
                          administrator?.name ||
                          `${
                            administrator?.firstName ||
                            ""
                          } ${
                            administrator?.lastName ||
                            ""
                          }`.trim() ||
                          "Administrator"}
                      </td>
                    </tr>

                    <tr>
                      <th scope="row">
                        Date endorsed
                      </th>

                      <td>
                        {report.endorsedAt
                          ? new Date(
                              report.endorsedAt
                            ).toLocaleString()
                          : "Not available"}
                      </td>
                    </tr>

                    {report.endorsementReference && (
                      <tr>
                        <th scope="row">
                          Outgoing reference
                        </th>

                        <td>
                          {
                            report.endorsementReference
                          }
                        </td>
                      </tr>
                    )}

                    <tr>
                      <th scope="row">
                        Purpose
                      </th>

                      <td className="pdf-long-text">
                        Submitted for Engineering
                        Office review and
                        appropriate action.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </article>
            )
          )}
        </section>
      )}

      {selectedReport && (
        <section className="printable-report">
          <p className="eyebrow">
            ROADWATCH INSPECTION &amp;
            ENDORSEMENT REPORT
          </p>

          <h1>
            {selectedReport.issue}
          </h1>

          <p>
            Report ID: {selectedReport.id}
          </p>

          <div className="print-report-grid">
            <p>
              <strong>
                Reporter:
              </strong>{" "}
              {selectedReport.reporter}
            </p>

            <p>
              <strong>
                Location:
              </strong>{" "}
              {selectedReport.location}
            </p>

            <p>
              <strong>
                Status:
              </strong>{" "}
              {selectedReport.status}
            </p>

            <p>
              <strong>
                Priority:
              </strong>{" "}
              {selectedReport.priority}
            </p>

            <p>
              <strong>
                Inspector:
              </strong>{" "}
              {selectedReport.inspectedBy ||
                selectedReport.verifiedBy ||
                "Not assigned"}
            </p>

            <p>
              <strong>
                Reviewed:
              </strong>{" "}
              {selectedReport.inspectedAt
                ? new Date(
                    selectedReport.inspectedAt
                  ).toLocaleString()
                : "Not available"}
            </p>
          </div>

          <h2>Description</h2>

          <p>
            {selectedReport.description}
          </p>

          <h2>Inspection Notes</h2>

          <p>
            {selectedReport.verificationNotes ||
              "No inspection notes provided."}
          </p>

          {selectedReport.endorsedAt && (
            <>
              <h2>
                Endorsement Record
              </h2>

              <p>
                <strong>
                  Endorsed to:
                </strong>{" "}
                {selectedReport.endorsedTo ||
                  "Engineering Office"}
              </p>

              <p>
                <strong>
                  Endorsed by:
                </strong>{" "}
                {selectedReport.endorsedBy ||
                  administrator?.name ||
                  `${
                    administrator?.firstName ||
                    ""
                  } ${
                    administrator?.lastName ||
                    ""
                  }`.trim() ||
                  "Administrator"}
              </p>

              <p>
                <strong>
                  Date endorsed:
                </strong>{" "}
                {new Date(
                  selectedReport.endorsedAt
                ).toLocaleString()}
              </p>

              {selectedReport.endorsementReference && (
                <p>
                  <strong>
                    Outgoing reference:
                  </strong>{" "}
                  {
                    selectedReport.endorsementReference
                  }
                </p>
              )}
            </>
          )}
        </section>
      )}
    </main>
  );
}
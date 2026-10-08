import { useState } from "react";
import ModalDialog from "../../components/ModalDialog";

export default function AdminCompletion({
  reports,
  onUpdateReport,
}) {
  const [selectedReport, setSelectedReport] = useState(null);
  const [activeTab, setActiveTab] = useState("awaiting");
  const [search, setSearch] = useState("");
  const [closedSearch, setClosedSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [updatingReport, setUpdatingReport] = useState(false);

  const activeReports = reports.filter(
    (report) => report.status === "Endorsed to Engineering Office"
  );
  const closedRecords = reports.filter(
    (report) => report.status === "Closed" && Boolean(report.endorsedAt)
  );
  const visibleClosedRecords = closedRecords
    .filter((report) => {
      const query = closedSearch.trim().toLowerCase();
      return !query || [
        report.id,
        report.issue,
        report.location,
        report.inspectedBy,
        report.priority,
        report.endorsedBy,
      ].some((value) => String(value || "").toLowerCase().includes(query));
    })
    .sort((left, right) => {
      const leftValue = sortBy === "priority"
        ? left.priority
        : sortBy === "issue"
          ? left.issue
          : left.closedAt || left.date || "";
      const rightValue = sortBy === "priority"
        ? right.priority
        : sortBy === "issue"
          ? right.issue
          : right.closedAt || right.date || "";
      const comparison = String(leftValue).localeCompare(
        String(rightValue),
        undefined,
        { numeric: true }
      );
      return sortDirection === "asc" ? comparison : -comparison;
    });
  const visibleReports = activeReports
    .filter((report) => {
      const query = search.trim().toLowerCase();
      return (
        !query ||
        [
          report.id,
          report.issue,
          report.location,
          report.inspectedBy,
          report.priority,
        ].some((value) =>
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
            : left.date || "";
      const rightValue =
        sortBy === "priority"
          ? right.priority
          : sortBy === "issue"
            ? right.issue
            : right.date || "";
      const comparison = String(leftValue).localeCompare(
        String(rightValue),
        undefined,
        { numeric: true }
      );
      return sortDirection === "asc" ? comparison : -comparison;
    });

  function handleTabKeyDown(event) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const nextTab = activeTab === "awaiting" ? "closed" : "awaiting";
    setActiveTab(nextTab);
    document.getElementById(`${nextTab}-reports-tab`)?.focus();
  }

  async function closeReport(report) {
    if (updatingReport) return;
    setUpdatingReport(true);
    try {
      const updatedReport = await onUpdateReport(report.id, "Closed", {
        closedAt: new Date().toISOString(),
      });
      if (updatedReport) setSelectedReport(null);
    } finally {
      setUpdatingReport(false);
    }
  }

  return (
    <main className="main">
      <p className="eyebrow">ADMINISTRATION</p>
      <h1>Report Completion</h1>
      <p className="subtitle">
      Track reports endorsed to the Engineering Office and close them
      after receiving completion confirmation.
      </p>

      <div className="completion-tabs" role="tablist" aria-label="Report completion sections">
        <button
          className={activeTab === "awaiting" ? "completion-tab active" : "completion-tab"}
          id="awaiting-reports-tab"
          type="button"
          role="tab"
          aria-selected={activeTab === "awaiting"}
          aria-controls="awaiting-reports-panel"
          tabIndex={activeTab === "awaiting" ? 0 : -1}
          onKeyDown={handleTabKeyDown}
          onClick={() => setActiveTab("awaiting")}
        >
          Awaiting Completion <span>{activeReports.length}</span>
        </button>
        <button
          className={activeTab === "closed" ? "completion-tab active" : "completion-tab"}
          id="closed-reports-tab"
          type="button"
          role="tab"
          aria-selected={activeTab === "closed"}
          aria-controls="closed-reports-panel"
          tabIndex={activeTab === "closed" ? 0 : -1}
          onKeyDown={handleTabKeyDown}
          onClick={() => setActiveTab("closed")}
        >
          Closed Reports <span>{closedRecords.length}</span>
        </button>
      </div>

      {activeTab === "awaiting" && (
      <section
        className="panel"
        id="awaiting-reports-panel"
        role="tabpanel"
        aria-labelledby="awaiting-reports-tab"
      >
        <div className="section-heading">
          <div>
            <h2>Reports Awaiting Completion</h2>
            <p>
              Close an endorsed report only after
              the Engineering Office confirms the work is complete.
            </p>
          </div>
          <span className="section-count">
            {visibleReports.length} Active
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
            />
          </label>
          <label>
            Sort by
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Date submitted</option>
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

        {visibleReports.length === 0 ? (
          <div className="empty-state">
            <p>
              {activeReports.length === 0
                ? "No reports are awaiting completion."
                : "No reports match your search."}
            </p>
          </div>
        ) : (
          <div className="table-container completion-table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Issue</th>
                  <th>Location</th>
                  <th>Inspector</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleReports.map((report) => (
                  <tr key={report.id}>
                    <td><strong>{report.id}</strong></td>
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
                        className={`status status-${report.status.toLowerCase()}`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="outline-btn small-btn"
                        onClick={() => setSelectedReport(report)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      )}

      {activeTab === "closed" && (
      <section
        className="panel closed-endorsement-records"
        id="closed-reports-panel"
        role="tabpanel"
        aria-labelledby="closed-reports-tab"
      >
        <div className="section-heading">
          <div>
            <h2>Closed Reports</h2>
            <p>
              Completed endorsed reports are retained here as permanent records.
            </p>
          </div>
          <span className="section-count">{visibleClosedRecords.length} Closed</span>
        </div>

        <div className="report-filter-form closed-record-search">
          <label>
            Search closed records
            <input
              type="search"
              placeholder="Report ID, issue, location, admin..."
              value={closedSearch}
              onChange={(e) => setClosedSearch(e.target.value)}
            />
          </label>
        </div>

        {visibleClosedRecords.length === 0 ? (
          <div className="empty-state">
            <p>
              {closedRecords.length === 0
                ? "No endorsed reports have been closed yet."
                : "No closed records match your search."}
            </p>
          </div>
        ) : (
          <div className="table-container completion-table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Issue</th>
                  <th>Location</th>
                  <th>Endorsed</th>
                  <th>Closed</th>
                  <th>Admin</th>
                  <th>Record</th>
                </tr>
              </thead>
              <tbody>
                {visibleClosedRecords.map((report) => (
                  <tr key={report.id}>
                    <td><strong>{report.id}</strong></td>
                    <td>{report.issue}</td>
                    <td>{report.location}</td>
                    <td>
                      {report.endorsedAt
                        ? new Date(report.endorsedAt).toLocaleDateString()
                        : "Not available"}
                    </td>
                    <td>
                      {report.closedAt
                        ? new Date(report.closedAt).toLocaleDateString()
                        : "Not available"}
                    </td>
                    <td>{report.endorsedBy || "Not available"}</td>
                    <td>
                      <button
                        className="outline-btn small-btn"
                        onClick={() => setSelectedReport(report)}
                      >
                        View Record
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      )}

      {selectedReport && (
        <ModalDialog
          className="report-preview"
          labelledBy="completion-report-title"
          onClose={() => {
            if (!updatingReport) setSelectedReport(null);
          }}
        >
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  {selectedReport.status === "Closed"
                    ? "CLOSED ENDORSEMENT RECORD"
                    : "ENGINEERING OFFICE ENDORSEMENT"}
                </p>
                <h2 id="completion-report-title">{selectedReport.id} - {selectedReport.issue}</h2>
              </div>
              <button
                className="outline-btn"
                type="button"
                disabled={updatingReport}
                onClick={() => setSelectedReport(null)}
              >
                Close
              </button>
            </div>

            <div className="detail-list">
              <p><strong>Location:</strong> {selectedReport.location}</p>
              <p><strong>Inspector:</strong> {selectedReport.inspectedBy || selectedReport.verifiedBy || "Not assigned"}</p>
              <p><strong>Priority:</strong> {selectedReport.priority}</p>
              <p><strong>Status:</strong> {selectedReport.status}</p>
              <p><strong>Notes:</strong> {selectedReport.verificationNotes || "No inspection notes provided."}</p>
              <p><strong>Endorsed by:</strong> {selectedReport.endorsedBy || "Not available"}</p>
              {selectedReport.endorsedAt && (
                <>
                  <p><strong>Endorsed to:</strong> {selectedReport.endorsedTo || "Engineering Office"}</p>
                  <p><strong>Endorsed on:</strong> {new Date(selectedReport.endorsedAt).toLocaleString()}</p>
                  {selectedReport.endorsementReference && (
                    <p><strong>Reference:</strong> {selectedReport.endorsementReference}</p>
                  )}
                </>
              )}
              {selectedReport.status === "Closed" && (
                <>
                  <p><strong>Closed on:</strong> {selectedReport.closedAt ? new Date(selectedReport.closedAt).toLocaleString() : "Not available"}</p>
                  <p><strong>Closed by:</strong> {selectedReport.closedByEmail || "Not available"}</p>
                  {selectedReport.completionNotes && (
                    <p><strong>Completion notes:</strong> {selectedReport.completionNotes}</p>
                  )}
                </>
              )}
            </div>

            {selectedReport.status !== "Closed" && (
              <button
                className="gold"
                onClick={() => closeReport(selectedReport)}
                disabled={updatingReport}
              >
                {updatingReport
                  ? "Saving..."
                  : "Confirm Completion & Close"}
              </button>
            )}
        </ModalDialog>
      )}
    </main>
  );
}

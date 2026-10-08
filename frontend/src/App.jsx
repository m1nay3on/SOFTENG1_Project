import { useEffect, useState } from "react";
import "./App.css";
import { api } from "./services/api";
import SuccessModal, { MinorModal } from "./components/Modals";
import FeedbackMessage from "./components/FeedbackMessage";
import Sidebar from "./components/Sidebar";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/citizen/Dashboard";
import SubmitReport from "./pages/citizen/SubmitReport";
import MyReports from "./pages/citizen/MyReports";
import ReportDetails from "./pages/citizen/ReportDetails";
import InspectorDashboard from "./pages/inspector/InspectorDashboard";
import InspectorReports from "./pages/inspector/InspectorReports";
import InspectorReportDetails from "./pages/inspector/InspectorReportDetails";
import AdminDashboard from "./pages/administrator/AdminDashboard";
import AdminReports from "./pages/administrator/AdminReports";
import AdminManagement from "./pages/administrator/AdminManagement";
import AdminCompletion from "./pages/administrator/AdminCompletion";
import Profile from "./pages/Profile";

const ACTIVE_PAGE_STORAGE_KEY = "roadwatch.activePage";

function getRestoredPage(role, reports) {
  const savedPage = sessionStorage.getItem(ACTIVE_PAGE_STORAGE_KEY);
  if (!savedPage) return "Dashboard";

  const [page, reportId] = savedPage.split(":");
  const rolePages = {
    Citizen: ["Dashboard", "Submit Report", "My Reports", "Report Details", "Profile"],
    "Field Inspector": ["Dashboard", "Verification Queue", "Inspector Reports", "Inspector Details", "Profile"],
    Administrator: ["Dashboard", "Inspected Reports", "Report Completion", "Administrator Tools", "Profile"],
  };
  if (!rolePages[role]?.includes(page)) return "Dashboard";

  if (
    (page === "Report Details" || page === "Inspector Details") &&
    (!reportId || !reports.some((report) => report.id === reportId))
  ) {
    return "Dashboard";
  }

  return savedPage;
}

export default function App() {

  const [active, setActive] =
    useState(() => {
      const savedEmail = localStorage.getItem("email");
      return savedEmail
        ? sessionStorage.getItem(`roadwatch.activePage:${savedEmail}`) || "Dashboard"
        : "Dashboard";
    });

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  const [users, setUsers] = useState([]);

  const [reports, setReports] = useState([]);

  const [currentUser, setCurrentUser] = useState(null);

  const [role, setRole] =
    useState(
      localStorage.getItem(
        "role"
      ) || ""
    );

  const [email, setEmail] =
    useState(
      localStorage.getItem(
        "email"
      ) || ""
    );

  const [password, setPassword] =
    useState("");

  const [
    authenticated,
    setAuthenticated,
  ] = useState(false);

  const [authLoading, setAuthLoading] = useState(
    Boolean(localStorage.getItem("token"))
  );

  const [authPage, setAuthPage] =
    useState("login");

  const [modal, setModal] =
    useState("");
  const [feedback, setFeedback] = useState("");

  const [
    showMinorModal,
    setShowMinorModal,
  ] = useState(false);

  useEffect(() => {
    if (authenticated && email) {
      sessionStorage.setItem(`roadwatch.activePage:${email}`, active);
    }
  }, [active, authenticated, email]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAuthLoading(false);
      return undefined;
    }

    let activeRequest = true;
    async function restoreSession() {
      try {
        const { user } = await api.get("/auth/me");
        const [loadedReports, loadedUsers] = await Promise.all([
          api.get("/reports"),
          user.role === "Administrator" ? api.get("/users") : Promise.resolve([user]),
        ]);
        if (!activeRequest) return;
        setCurrentUser(user);
        setRole(user.role);
        setEmail(user.email);
        setReports(loadedReports);
        setUsers(loadedUsers);
        setActive(getRestoredPage(user.role, loadedReports));
        setAuthenticated(true);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("email");
        localStorage.removeItem("authenticated");
      } finally {
        if (activeRequest) setAuthLoading(false);
      }
    }

    restoreSession();
    return () => {
      activeRequest = false;
    };
  }, []);

  useEffect(() => {
    if (authenticated) {
      sessionStorage.setItem(ACTIVE_PAGE_STORAGE_KEY, active);
    }
  }, [active, authenticated]);

  /* =====================================================
     LOGIN
  ===================================================== */

  async function handleLogin() {
    try {
      const result = await api.post("/auth/login", { email: email.trim(), password }, false);
      localStorage.setItem("token", result.token);
      localStorage.setItem("role", result.user.role);
      localStorage.setItem("email", result.user.email);
      localStorage.setItem("user", JSON.stringify(result.user));

      const [loadedReports, loadedUsers] = await Promise.all([
        api.get("/reports"),
        result.user.role === "Administrator" ? api.get("/users") : Promise.resolve([result.user]),
      ]);
      setCurrentUser(result.user);
      setRole(result.user.role);
      setEmail(result.user.email);
      setUsers(loadedUsers);
      setReports(loadedReports);
      setPassword("");
      setAuthenticated(true);
      setActive("Dashboard");
      sessionStorage.removeItem(ACTIVE_PAGE_STORAGE_KEY);
      setModal("Login successful.");
      setFeedback("");
    } catch (error) {
      setFeedback(error.message);
    }
  }

  /* =====================================================
     REGISTRATION
  ===================================================== */

  async function handleRegistrationSuccess(user) {
    try {
      const result = await api.post("/auth/register", user, false);
      setUsers((previousUsers) => [...previousUsers, result.user]);
      setAuthPage("login");
      setModal("Your account has been created successfully.");
      setFeedback("");
    } catch (error) {
      setFeedback(error.message);
    }
  }

  /* =====================================================
     SUBMIT REPORT
  ===================================================== */

  async function handleSubmitReport(report) {
    try {
      const createdReport = await api.post("/reports", report);
      setReports((previousReports) => [createdReport, ...previousReports]);
      setActive("My Reports");
      setModal("Your report has been submitted successfully.");
      setFeedback("");
    } catch (error) {
      setFeedback(error.message);
    }
  }

  /* =====================================================
     UPDATE REPORT
  ===================================================== */

  async function updateReportStatus(reportId, status, inspection = {}) {
    try {
      const updatedReport = await api.patch(`/reports/${encodeURIComponent(reportId)}/status`, {
        status,
        ...inspection,
      });
      setReports((previousReports) => previousReports.map((report) => (
        report.id === reportId ? updatedReport : report
      )));
      setFeedback("");
      return updatedReport;
    } catch (error) {
      setFeedback(error.message);
      return null;
    }
  }

  async function createAdminUser(user) {
    try {
      const createdUser = await api.post("/users", user);
      setUsers((previousUsers) => [...previousUsers, createdUser]);
      setFeedback("");
      return true;
    } catch (error) {
      setFeedback(error.message);
      return false;
    }
  }

  /* =====================================================
     LOGOUT
  ===================================================== */

  function handleLogout() {
    if (email) {
      sessionStorage.removeItem(`roadwatch.activePage:${email}`);
    }

    localStorage.removeItem(
      "role"
    );

    localStorage.removeItem(
      "email"
    );

    localStorage.removeItem(
      "authenticated"
    );
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem(ACTIVE_PAGE_STORAGE_KEY);

    setRole("");
    setEmail("");
    setCurrentUser(null);
    setPassword("");
    setFeedback("");

    setAuthenticated(false);

    setAuthPage("login");

    setActive("Dashboard");
  }

  /* =====================================================
     AUTHENTICATION SCREEN
  ===================================================== */

  if (!authenticated) {

    if (authLoading) {
      return <main className="auth-page" aria-live="polite">Loading account...</main>;
    }

    if (authPage === "login") {
      return (
        <>
          <Login
            email={email}
            feedback={feedback}
            onDismissFeedback={() => setFeedback("")}
            password={password}
            setEmail={setEmail}
            setPassword={
              setPassword
            }
            onLogin={
              handleLogin
            }
            setAuthPage={
              setAuthPage
            }
          />

          {modal && (
            <SuccessModal
              message={modal}
              onClose={() =>
                setModal("")
              }
            />
          )}
        </>
      );
    }

    return (
      <>
        <Register
          feedback={feedback}
          onDismissFeedback={() => setFeedback("")}
          setAuthPage={
            setAuthPage
          }
          onRegister={
            handleRegistrationSuccess
          }
          setShowMinorModal={
            setShowMinorModal
          }
        />

        {modal && (
          <SuccessModal
            message={modal}
            onClose={() =>
              setModal("")
            }
          />
        )}

        {showMinorModal && (
          <MinorModal
            onClose={() =>
              setShowMinorModal(
                false
              )
            }
          />
        )}
      </>
    );
  }

  /* =====================================================
     SELECTED REPORT
  ===================================================== */

  const selectedReportId =
    active.includes(":")
      ? active.split(":")[1]
      : null;

  const selectedReport =
    reports.find(
      (report) =>
        report.id ===
        selectedReportId
    );

  /* =====================================================
     AUTHENTICATED APPLICATION
  ===================================================== */

  return (
    <div className="app">

      <Sidebar
        role={role}
        active={
          active.includes(":")
            ? active.split(":")[0]
            : active
        }
        setActive={
          setActive
        }
        user={
          currentUser
        }
        collapsed={sidebarCollapsed}
        onToggle={() =>
          setSidebarCollapsed(
            (collapsed) => !collapsed
          )
        }
      />

      <FeedbackMessage
        message={feedback}
        onDismiss={() => setFeedback("")}
      />

      {/* CITIZEN DASHBOARD */}

      {active ===
        "Dashboard" &&
        role === "Citizen" && (
          <Dashboard
            setActive={
              setActive
            }
            reports={
              reports
            }
            user={
              currentUser
            }
          />
        )}

      {/* INSPECTOR DASHBOARD */}

      {active ===
        "Dashboard" &&
        role ===
          "Field Inspector" && (
          <InspectorDashboard
            setActive={
              setActive
            }
            reports={
              reports
            }
            view="recent"
          />
        )}

      {/* ADMIN DASHBOARD */}

      {active ===
        "Dashboard" &&
        role ===
          "Administrator" && (
          <AdminDashboard
            reports={reports}
          />
        )}

      {/* SUBMIT REPORT */}

      {active ===
        "Submit Report" &&
        role === "Citizen" && (
          <SubmitReport
            setActive={
              setActive
            }
            user={
              currentUser
            }
            onSubmit={
              handleSubmitReport
            }
          />
        )}

      {/* MY REPORTS */}

      {active ===
        "My Reports" &&
        role === "Citizen" && (
          <MyReports
            setActive={
              setActive
            }
            reports={
              reports
            }
            user={
              currentUser
            }
          />
        )}

      {/* CITIZEN REPORT DETAILS */}

      {active.startsWith(
        "Report Details:"
      ) &&
        role === "Citizen" && (
          <ReportDetails
            setActive={
              setActive
            }
            report={
              selectedReport
            }
          />
        )}

      {/* VERIFICATION QUEUE */}

      {active ===
        "Verification Queue" &&
        role ===
          "Field Inspector" && (
          <InspectorDashboard
            setActive={
              setActive
            }
            reports={
              reports
            }
            view="queue"
          />
        )}

      {/* INSPECTOR REPORTS */}

      {active ===
        "Inspector Reports" &&
        role ===
          "Field Inspector" && (
          <InspectorReports
            setActive={
              setActive
            }
            reports={
              reports
            }
          />
        )}

      {/* INSPECTOR DETAILS */}

      {active.startsWith(
        "Inspector Details:"
      ) &&
        role ===
          "Field Inspector" && (
          <InspectorReportDetails
            setActive={
              setActive
            }
            report={
              selectedReport
            }
            inspector={currentUser}
            onUpdateReport={
              updateReportStatus
            }
          />
        )}

      {/* ADMINISTRATOR */}

      {active ===
        "Administrator Tools" &&
        role ===
          "Administrator" && (
          <AdminManagement
            reports={reports}
            users={users}
            onCreateUser={createAdminUser}
          />
        )}

      {/* ADMIN INSPECTED REPORTS */}

      {active ===
        "Inspected Reports" &&
        role ===
          "Administrator" && (
          <AdminReports
            reports={
              reports
            }
            administrator={currentUser}
            onUpdateReport={
              updateReportStatus
            }
          />
        )}

      {/* ADMIN REPORT COMPLETION */}

      {active ===
        "Report Completion" &&
        role ===
          "Administrator" && (
          <AdminCompletion
            reports={reports}
            onUpdateReport={
              updateReportStatus
            }
          />
        )}

      {/* PROFILE */}

      {active === "Profile" && (
        <Profile
          user={
            currentUser
          }
          role={role}
          onLogout={
            handleLogout
          }
        />
      )}

      {/* SUCCESS MODAL */}

      {modal && (
        <SuccessModal
          message={modal}
          onClose={() =>
            setModal("")
          }
        />
      )}

    </div>
  );
}

import logo from "../../assets/roadwatch-logo.png";
import FeedbackMessage from "../../components/FeedbackMessage";


export default function Login({
  email,
  password,
  setEmail,
  setPassword,
  onLogin,
  setAuthPage,
  feedback,
  onDismissFeedback,
}) {
  return (
    <main className="auth-page">
      <div className="auth-card login-card">
        <img
          src={logo}
          alt="RoadWatch Logo"
          className="auth-logo"
        />

        <h1>RoadWatch</h1>

        <p className="auth-subtitle">
          Public Infrastructure Monitoring
          System
        </p>

        <form
          className="form"
          onSubmit={(event) => {
            event.preventDefault();
            onLogin();
          }}
        >
          <FeedbackMessage
            message={feedback}
            onDismiss={onDismissFeedback}
          />
          <label>
            Email Address

            <input
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                onDismissFeedback();
              }}
            />
          </label>

          <label>
            Password

            <input
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                onDismissFeedback();
              }}
            />
          </label>

          <button
            className="gold auth-submit"
            type="submit"
          >
            Log In
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?

          <button
            className="link-btn"
            type="button"
            onClick={() =>
              setAuthPage("register")
            }
          >
            Create Account
          </button>
        </p>
      </div>
    </main>
  );
}

/* =========================================================
   REGISTER / CREATE ACCOUNT
========================================================= */

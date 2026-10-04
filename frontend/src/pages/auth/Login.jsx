import logo from "../../assets/roadwatch-logo.png";

export default function Login({
  email,
  password,
  setEmail,
  setPassword,
  onLogin,
  setAuthPage,
  loginError,
}) {
  function handleSubmit(event) {
    event.preventDefault();
    onLogin();
  }

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
          Public Infrastructure Monitoring System
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">
            Email Address
          </label>

          <input
            id="login-email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="login-password">
            Password
          </label>

          <input
            id="login-password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          {loginError && (
            <div
              className="login-error"
              role="alert"
              aria-live="polite"
            >
              <span
                className="login-error-icon"
                aria-hidden="true"
              >
                ⚠
              </span>

              <span>{loginError}</span>
            </div>
          )}

          <button
            type="submit"
            className="gold auth-submit"
          >
            Log In
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{" "}
          <button
            type="button"
            className="link-btn"
            onClick={() => setAuthPage("register")}
          >
            Create Account
          </button>
        </p>
      </div>
    </main>
  );
}
function AuthPanel({
  authMode,
  setAuthMode,
  authForm,
  setAuthForm,
  authBusy,
  authError,
  onSubmit,
}) {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="kicker">TaskTracker Workspace</p>
        <h1>{authMode === "login" ? "Welcome back" : "Create account"}</h1>
        <p className="subtitle">
          {authMode === "login"
            ? "Sign in to access tasks, subtasks, and member roles."
            : "Register to start managing tasks with your team."}
        </p>

        <div className="segmented" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            className={`segment ${authMode === "login" ? "is-active" : ""}`}
            onClick={() => setAuthMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={`segment ${authMode === "register" ? "is-active" : ""}`}
            onClick={() => setAuthMode("register")}
          >
            Register
          </button>
        </div>

        <form className="form-grid" onSubmit={onSubmit}>
          <label className="field">
            <span>Username</span>
            <input
              placeholder="e.g. user_123"
              value={authForm.username}
              onChange={(event) => setAuthForm((prev) => ({ ...prev, username: event.target.value }))}
              required
            />
          </label>

          {authMode === "register" && (
            <label className="field">
              <span>Email</span>
              <input
                placeholder="name@example.com"
                type="email"
                value={authForm.email}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </label>
          )}

          <label className="field">
            <span>Password</span>
            <input
              placeholder="At least 8 characters"
              type="password"
              value={authForm.password}
              onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
          </label>

          {authError && <p className="feedback feedback--error">{authError}</p>}

          <button disabled={authBusy}>{authBusy ? "Sending..." : "Continue"}</button>
        </form>
      </section>
    </main>
  );
}

export default AuthPanel;

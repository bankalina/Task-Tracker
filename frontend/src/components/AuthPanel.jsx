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
    <main className="wrapper">
      <h1>TaskTracker</h1>
      <p>{authMode === "login" ? "Sign in to continue." : "Create a new account."}</p>

      <p>
        <button onClick={() => setAuthMode("login")}>Login</button>
        <button onClick={() => setAuthMode("register")}>Register</button>
      </p>

      <form onSubmit={onSubmit}>
        <p>
          <input
            placeholder="Username"
            value={authForm.username}
            onChange={(event) => setAuthForm((prev) => ({ ...prev, username: event.target.value }))}
            required
          />
        </p>

        {authMode === "register" && (
          <p>
            <input
              placeholder="Email"
              type="email"
              value={authForm.email}
              onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))}
            />
          </p>
        )}

        <p>
          <input
            placeholder="Password"
            type="password"
            value={authForm.password}
            onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
            required
          />
        </p>

        {authError && <p>{authError}</p>}

        <button disabled={authBusy}>{authBusy ? "Sending..." : "Submit"}</button>
      </form>
    </main>
  );
}

export default AuthPanel;

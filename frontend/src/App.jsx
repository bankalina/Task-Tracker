import { useMemo, useState } from "react";
import "./App.css";
import { createApi } from "./api";
import AuthPanel from "./components/AuthPanel";

function readStoredTokens() {
  return {
    access: localStorage.getItem("tt_access") || "",
    refresh: localStorage.getItem("tt_refresh") || "",
  };
}

function writeStoredTokens(tokens) {
  if (tokens.access) {
    localStorage.setItem("tt_access", tokens.access);
  } else {
    localStorage.removeItem("tt_access");
  }

  if (tokens.refresh) {
    localStorage.setItem("tt_refresh", tokens.refresh);
  } else {
    localStorage.removeItem("tt_refresh");
  }
}

function getErrorMessage(error) {
  if (!error) return "Unknown error";
  if (error.data?.detail) return String(error.data.detail);
  if (error.data?.error) return String(error.data.error);
  if (typeof error.data === "string") return error.data;
  if (error.status) return `Request failed (${error.status})`;
  return error.message || "Unknown error";
}

function App() {
  const [tokens, setTokens] = useState(readStoredTokens);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ username: "", email: "", password: "" });
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [profile, setProfile] = useState(null);

  const api = useMemo(
    () =>
      createApi({
        getAccessToken: () => tokens.access,
        getRefreshToken: () => tokens.refresh,
        setTokens: (next) => {
          const merged = { access: next.access || "", refresh: next.refresh || tokens.refresh || "" };
          setTokens(merged);
          writeStoredTokens(merged);
        },
        onAuthFail: () => {
          const empty = { access: "", refresh: "" };
          setTokens(empty);
          writeStoredTokens(empty);
          setProfile(null);
        },
      }),
    [tokens.access, tokens.refresh],
  );

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError("");

    try {
      const path = authMode === "login" ? "/login/" : "/register/";
      const payload =
        authMode === "login"
          ? { username: authForm.username, password: authForm.password }
          : {
              username: authForm.username,
              email: authForm.email,
              password: authForm.password,
            };

      const data = await api.post(path, payload);
      const next = { access: data.access || "", refresh: data.refresh || "" };
      setTokens(next);
      writeStoredTokens(next);
      setAuthForm({ username: "", email: "", password: "" });

      const me = await api.get("/profile/");
      setProfile(me);
    } catch (error) {
      setAuthError(getErrorMessage(error));
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    try {
      if (tokens.refresh) {
        await api.post("/logout/", { refresh: tokens.refresh });
      }
    } catch {
      // clear local tokens regardless of logout response
    } finally {
      const empty = { access: "", refresh: "" };
      setTokens(empty);
      writeStoredTokens(empty);
      setProfile(null);
    }
  }

  if (!tokens.access) {
    return (
      <AuthPanel
        authMode={authMode}
        setAuthMode={setAuthMode}
        authForm={authForm}
        setAuthForm={setAuthForm}
        authBusy={authBusy}
        authError={authError}
        onSubmit={handleAuthSubmit}
      />
    );
  }

  return (
    <main className="wrapper">
      <h1>TaskTracker</h1>
      <p>{profile ? `Logged in as ${profile.username}` : "Authenticated session active."}</p>
      <button onClick={handleLogout}>Log out</button>
    </main>
  );
}

export default App;

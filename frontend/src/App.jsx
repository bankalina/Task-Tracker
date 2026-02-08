import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import { createApi } from "./api";
import AuthPanel from "./components/AuthPanel";
import TasksPanel from "./components/TasksPanel";
import TaskDetailsPanel from "./components/TaskDetailsPanel";
import SubtasksPanel from "./components/SubtasksPanel";
import MembershipsPanel from "./components/MembershipsPanel";

const EMPTY_TASK_FORM = {
  title: "",
  description: "",
  deadline: "",
  priority: "Medium",
  status: "To do",
};

const EMPTY_SUBTASK_FORM = {
  title: "",
  description: "",
  status: "To do",
};

const EMPTY_MEMBERSHIP_FORM = {
  user_id: "",
  role: "Assigned",
};

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

function formatFieldLabel(field) {
  const labels = {
    username: "Username",
    email: "Email",
    password: "Password",
    non_field_errors: "Error",
    detail: "Error",
  };
  return labels[field] || field;
}

function normalizeValidationMessage(field, message) {
  const msg = String(message);
  const lower = msg.toLowerCase();

  if (field === "username" && lower.includes("already exists")) {
    return "This username is already taken.";
  }
  if (field === "email" && lower.includes("already exists")) {
    return "This email is already taken.";
  }
  if (field === "password" && lower.includes("too short")) {
    return "Password is too short.";
  }
  if (field === "password" && lower.includes("too common")) {
    return "Password is too common.";
  }
  if (field === "password" && lower.includes("entirely numeric")) {
    return "Password cannot be only numbers.";
  }
  if (lower.includes("unable to log in") || lower.includes("invalid credentials")) {
    return "Invalid username or password.";
  }
  if (lower.includes("invalid password")) {
    return "Invalid password.";
  }

  return msg;
}

function extractValidationMessage(payload) {
  if (!payload || typeof payload !== "object") return "";

  for (const [field, value] of Object.entries(payload)) {
    if (Array.isArray(value) && value.length) {
      const first = value[0];
      if (typeof first === "string") {
        return `${formatFieldLabel(field)}: ${normalizeValidationMessage(field, first)}`;
      }
      if (first && typeof first === "object") {
        const nested = extractValidationMessage(first);
        if (nested) return nested;
      }
    }

    if (typeof value === "string") {
      return `${formatFieldLabel(field)}: ${normalizeValidationMessage(field, value)}`;
    }

    if (value && typeof value === "object") {
      const nested = extractValidationMessage(value);
      if (nested) return nested;
    }
  }

  return "";
}

function getStatusMessage(status) {
  if (status === 400) return "Could not save changes. Check the form data.";
  if (status === 401) return "Session expired. Please sign in again.";
  if (status === 403) return "You do not have permission for this action.";
  if (status === 404) return "Requested data was not found.";
  if (status === 409) return "Conflict detected. Refresh and try again.";
  if (status >= 500) return "Server error. Please try again in a moment.";
  if (status >= 400) return "Could not complete the request.";
  return "";
}

function getErrorMessage(error) {
  if (!error) return "Unexpected error. Please try again.";

  const detail = error.data?.detail ? String(error.data.detail) : "";
  const detailLower = detail.toLowerCase();

  if (
    detail.includes("token not valid for any token type") ||
    detailLower.includes("token is invalid or expired")
  ) {
    return "Session expired. Please sign in again.";
  }
  if (detailLower.includes("authentication credentials were not provided")) {
    return "Please sign in to continue.";
  }
  if (detailLower.includes("cannot change your own role")) {
    return "You cannot change your own role in this task.";
  }
  if (detailLower.includes("cannot remove yourself")) {
    return "You cannot remove yourself from this task.";
  }

  const validationMessage = extractValidationMessage(error.data);
  if (validationMessage) return validationMessage;

  if (typeof error.data === "string") {
    const text = error.data.trim();
    if (text.startsWith("<!DOCTYPE") || text.startsWith("<html")) {
      return "Server error. Please try again in a moment.";
    }
    return "Could not complete the request.";
  }

  if (error.status) return getStatusMessage(error.status);
  if (error.message) return "Could not complete the request.";
  return "Unexpected error. Please try again.";
}

function App() {
  const [tokens, setTokens] = useState(readStoredTokens);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ username: "", email: "", password: "" });
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [profile, setProfile] = useState(null);
  const [bootError, setBootError] = useState("");
  const [bootLoading, setBootLoading] = useState(false);
  const [users, setUsers] = useState([]);

  const [taskForm, setTaskForm] = useState(EMPTY_TASK_FORM);
  const [taskCreateBusy, setTaskCreateBusy] = useState(false);
  const [taskCreateError, setTaskCreateError] = useState("");
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [taskEditForm, setTaskEditForm] = useState(EMPTY_TASK_FORM);
  const [taskEditBusy, setTaskEditBusy] = useState(false);
  const [taskEditError, setTaskEditError] = useState("");
  const [subtasks, setSubtasks] = useState([]);
  const [subtasksLoading, setSubtasksLoading] = useState(false);
  const [subtasksError, setSubtasksError] = useState("");
  const [subtaskForm, setSubtaskForm] = useState(EMPTY_SUBTASK_FORM);
  const [subtaskBusy, setSubtaskBusy] = useState(false);
  const [subtaskError, setSubtaskError] = useState("");
  const [memberships, setMemberships] = useState([]);
  const [membershipsLoading, setMembershipsLoading] = useState(false);
  const [membershipsError, setMembershipsError] = useState("");
  const [membershipForm, setMembershipForm] = useState(EMPTY_MEMBERSHIP_FORM);
  const [membershipBusy, setMembershipBusy] = useState(false);
  const [membershipError, setMembershipError] = useState("");

  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");
  const [deleteAccountBusy, setDeleteAccountBusy] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState("");

  const clearSession = useCallback(() => {
    const empty = { access: "", refresh: "" };
    setTokens(empty);
    writeStoredTokens(empty);
    setProfile(null);
    setTasks([]);
    setSelectedTaskId(null);
    setSubtasks([]);
    setMemberships([]);
    setUsers([]);
    setDeleteAccountOpen(false);
    setDeleteAccountPassword("");
    setDeleteAccountError("");
  }, []);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) || null,
    [tasks, selectedTaskId],
  );

  const currentTaskMembership = useMemo(() => {
    if (!profile) return null;
    return memberships.find((membership) => (membership.user?.id ?? membership.user_id) === profile.id) || null;
  }, [memberships, profile]);

  const canManageMemberships = currentTaskMembership?.role === "Owner";

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
        onAuthFail: clearSession,
      }),
    [tokens.access, tokens.refresh, clearSession],
  );

  const loadTasks = useCallback(async () => {
    setTasksLoading(true);
    setTasksError("");
    try {
      const data = await api.get("/tasks/");
      setTasks(data);
      setSelectedTaskId((previous) => {
        if (!data.length) return null;
        if (!previous) return data[0].id;
        return data.some((task) => task.id === previous) ? previous : data[0].id;
      });
    } catch (error) {
      setTasksError(getErrorMessage(error));
    } finally {
      setTasksLoading(false);
    }
  }, [api]);

  const loadUsers = useCallback(async () => {
    try {
      const data = await api.get("/users/");
      setUsers(data);
    } catch {
      setUsers([]);
    }
  }, [api]);

  useEffect(() => {
    if (!selectedTask) return;
    setTaskEditForm({
      title: selectedTask.title || "",
      description: selectedTask.description || "",
      deadline: selectedTask.deadline || "",
      priority: selectedTask.priority || "Medium",
      status: selectedTask.status || "To do",
    });
  }, [selectedTask]);

  const loadSubtasks = useCallback(
    async (taskId) => {
      if (!taskId) return;
      setSubtasksLoading(true);
      setSubtasksError("");
      try {
        const data = await api.get(`/tasks/${taskId}/subtasks/`);
        setSubtasks(data);
      } catch (error) {
        setSubtasksError(getErrorMessage(error));
        setSubtasks([]);
      } finally {
        setSubtasksLoading(false);
      }
    },
    [api],
  );

  const loadMemberships = useCallback(
    async (taskId) => {
      if (!taskId) return;
      setMembershipsLoading(true);
      setMembershipsError("");
      try {
        const data = await api.get(`/tasks/${taskId}/memberships/`);
        setMemberships(data);
      } catch (error) {
        setMembershipsError(getErrorMessage(error));
        setMemberships([]);
      } finally {
        setMembershipsLoading(false);
      }
    },
    [api],
  );

  useEffect(() => {
    if (!tokens.access) return;
    let mounted = true;

    (async () => {
      setBootLoading(true);
      setBootError("");
      try {
        const [me] = await Promise.all([api.get("/profile/"), loadTasks(), loadUsers()]);
        if (mounted) {
          setProfile(me);
        }
      } catch (error) {
        if (mounted) {
          setBootError(getErrorMessage(error));
        }
      } finally {
        if (mounted) {
          setBootLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [tokens.access, api, loadTasks, loadUsers]);

  useEffect(() => {
    if (!tokens.access || !selectedTaskId) return;
    loadSubtasks(selectedTaskId);
    loadMemberships(selectedTaskId);
  }, [tokens.access, selectedTaskId, loadSubtasks, loadMemberships]);

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
      // Session will be cleared regardless of logout response
    } finally {
      clearSession();
    }
  }

  async function handleDeleteAccount(event) {
    event.preventDefault();
    if (!deleteAccountPassword.trim()) {
      setDeleteAccountError("Password is required.");
      return;
    }

    const accepted = window.confirm("Delete your account permanently?");
    if (!accepted) return;

    setDeleteAccountBusy(true);
    setDeleteAccountError("");
    try {
      await api.del("/profile/", { password: deleteAccountPassword });
      clearSession();
      setAuthMode("login");
      setAuthError("");
    } catch (error) {
      setDeleteAccountError(getErrorMessage(error));
    } finally {
      setDeleteAccountBusy(false);
    }
  }

  async function handleTaskCreate(event) {
    event.preventDefault();
    setTaskCreateBusy(true);
    setTaskCreateError("");
    try {
      const created = await api.post("/tasks/", taskForm);
      setTaskForm(EMPTY_TASK_FORM);
      await loadTasks();
      if (created?.id) {
        setSelectedTaskId(created.id);
      }
    } catch (error) {
      setTaskCreateError(getErrorMessage(error));
    } finally {
      setTaskCreateBusy(false);
    }
  }

  async function handleTaskUpdate(event) {
    event.preventDefault();
    if (!selectedTask) return;
    setTaskEditBusy(true);
    setTaskEditError("");
    try {
      await api.patch(`/tasks/${selectedTask.id}/`, taskEditForm);
      await loadTasks();
    } catch (error) {
      setTaskEditError(getErrorMessage(error));
    } finally {
      setTaskEditBusy(false);
    }
  }

  async function handleTaskDelete() {
    if (!selectedTask) return;
    const accepted = window.confirm("Delete this task?");
    if (!accepted) return;
    setTaskEditError("");
    try {
      await api.del(`/tasks/${selectedTask.id}/`);
      await loadTasks();
      setSubtasks([]);
      setMemberships([]);
    } catch (error) {
      setTaskEditError(getErrorMessage(error));
    }
  }

  async function handleSubtaskCreate(event) {
    event.preventDefault();
    if (!selectedTask) return;
    setSubtaskBusy(true);
    setSubtaskError("");
    try {
      await api.post(`/tasks/${selectedTask.id}/subtasks/`, subtaskForm);
      setSubtaskForm(EMPTY_SUBTASK_FORM);
      await loadSubtasks(selectedTask.id);
    } catch (error) {
      setSubtaskError(getErrorMessage(error));
    } finally {
      setSubtaskBusy(false);
    }
  }

  async function handleSubtaskStatusChange(subtaskId, status) {
    if (!selectedTask) return;
    setSubtaskError("");
    try {
      await api.patch(`/subtasks/${subtaskId}/`, { status });
      await loadSubtasks(selectedTask.id);
    } catch (error) {
      setSubtaskError(getErrorMessage(error));
    }
  }

  async function handleSubtaskDelete(subtaskId) {
    if (!selectedTask) return;
    setSubtaskError("");
    try {
      await api.del(`/subtasks/${subtaskId}/`);
      await loadSubtasks(selectedTask.id);
    } catch (error) {
      setSubtaskError(getErrorMessage(error));
    }
  }

  async function handleMembershipCreate(event) {
    event.preventDefault();
    if (!selectedTask || !membershipForm.user_id) return;
    setMembershipBusy(true);
    setMembershipError("");
    try {
      await api.post(`/tasks/${selectedTask.id}/memberships/`, {
        user_id: Number(membershipForm.user_id),
        role: membershipForm.role,
      });
      setMembershipForm(EMPTY_MEMBERSHIP_FORM);
      await loadMemberships(selectedTask.id);
    } catch (error) {
      setMembershipError(getErrorMessage(error));
    } finally {
      setMembershipBusy(false);
    }
  }

  async function handleMembershipRoleUpdate(userId, role) {
    if (!selectedTask || !userId) return;
    setMembershipError("");
    try {
      await api.patch(`/tasks/${selectedTask.id}/memberships/${userId}/`, { role });
      await loadMemberships(selectedTask.id);
    } catch (error) {
      setMembershipError(getErrorMessage(error));
    }
  }

  async function handleMembershipDelete(userId) {
    if (!selectedTask || !userId) return;
    setMembershipError("");
    try {
      await api.del(`/tasks/${selectedTask.id}/memberships/${userId}/`);
      await loadMemberships(selectedTask.id);
    } catch (error) {
      setMembershipError(getErrorMessage(error));
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

  const stats = [
    { label: "Tasks", value: tasks.length },
    { label: "Subtasks", value: subtasks.length },
    { label: "Members", value: memberships.length },
  ];

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="kicker">TaskTracker Workspace</p>
          <h1>Project Command Center</h1>
          <p className="subtitle">
            {profile ? `Logged in as ${profile.username}` : "Authenticated session active."}
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="ghost-button" onClick={handleLogout}>
            Log out
          </button>
          <button
            type="button"
            className="danger-button subtle-danger"
            onClick={() => {
              setDeleteAccountOpen((prev) => !prev);
              setDeleteAccountError("");
            }}
          >
            Delete account
          </button>
        </div>
      </header>

      {deleteAccountOpen && (
        <section className="panel panel--danger">
          <div className="panel-head">
            <h2>Delete Account</h2>
          </div>
          <p className="feedback">This action is permanent. Confirm with your password.</p>
          <form className="form-grid" onSubmit={handleDeleteAccount}>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={deleteAccountPassword}
                onChange={(event) => setDeleteAccountPassword(event.target.value)}
                required
              />
            </label>
            {deleteAccountError && <p className="feedback feedback--error">{deleteAccountError}</p>}
            <div className="row two-col">
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  setDeleteAccountOpen(false);
                  setDeleteAccountPassword("");
                  setDeleteAccountError("");
                }}
              >
                Cancel
              </button>
              <button type="submit" className="danger-button" disabled={deleteAccountBusy}>
                {deleteAccountBusy ? "Deleting..." : "Confirm delete"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="stats-grid" aria-label="Workspace summary">
        {stats.map((stat) => (
          <article key={stat.label} className="stat-card">
            <p className="stat-label">{stat.label}</p>
            <p className="stat-value">{stat.value}</p>
          </article>
        ))}
      </section>

      {bootError && <p className="feedback feedback--error">{bootError}</p>}
      {bootLoading && <p className="feedback">Loading workspace...</p>}

      <section className="dashboard-grid">
        <div className="stack">
          <TasksPanel
            taskForm={taskForm}
            setTaskForm={setTaskForm}
            taskCreateBusy={taskCreateBusy}
            taskCreateError={taskCreateError}
            onTaskCreate={handleTaskCreate}
            tasks={tasks}
            tasksLoading={tasksLoading}
            tasksError={tasksError}
            selectedTaskId={selectedTaskId}
            setSelectedTaskId={setSelectedTaskId}
            onRefreshTasks={loadTasks}
          />
          <MembershipsPanel
            selectedTask={selectedTask}
            currentUserId={profile?.id ?? null}
            canManageMemberships={canManageMemberships}
            users={users}
            memberships={memberships}
            membershipsLoading={membershipsLoading}
            membershipsError={membershipsError}
            membershipForm={membershipForm}
            setMembershipForm={setMembershipForm}
            membershipBusy={membershipBusy}
            membershipError={membershipError}
            onMembershipCreate={handleMembershipCreate}
            onMembershipRoleUpdate={handleMembershipRoleUpdate}
            onMembershipDelete={handleMembershipDelete}
            onRefreshMemberships={loadMemberships}
          />
        </div>

        <div className="stack">
          <TaskDetailsPanel
            selectedTask={selectedTask}
            taskEditForm={taskEditForm}
            setTaskEditForm={setTaskEditForm}
            taskEditBusy={taskEditBusy}
            taskEditError={taskEditError}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
          />
          <SubtasksPanel
            selectedTask={selectedTask}
            subtasks={subtasks}
            subtasksLoading={subtasksLoading}
            subtasksError={subtasksError}
            subtaskForm={subtaskForm}
            setSubtaskForm={setSubtaskForm}
            subtaskBusy={subtaskBusy}
            subtaskError={subtaskError}
            onSubtaskCreate={handleSubtaskCreate}
            onSubtaskStatusChange={handleSubtaskStatusChange}
            onSubtaskDelete={handleSubtaskDelete}
            onRefreshSubtasks={loadSubtasks}
          />
        </div>
      </section>
    </main>
  );
}

export default App;

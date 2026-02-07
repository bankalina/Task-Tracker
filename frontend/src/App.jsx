import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import { createApi } from "./api";
import AuthPanel from "./components/AuthPanel";
import TasksPanel from "./components/TasksPanel";
import TaskDetailsPanel from "./components/TaskDetailsPanel";
import SubtasksPanel from "./components/SubtasksPanel";

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
  const [bootError, setBootError] = useState("");
  const [bootLoading, setBootLoading] = useState(false);

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

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) || null,
    [tasks, selectedTaskId],
  );

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
          setTasks([]);
          setSelectedTaskId(null);
          setSubtasks([]);
        },
      }),
    [tokens.access, tokens.refresh],
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

  useEffect(() => {
    if (!tokens.access) return;
    let mounted = true;
    (async () => {
      setBootLoading(true);
      setBootError("");
      try {
        const [me] = await Promise.all([api.get("/profile/"), loadTasks()]);
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
  }, [tokens.access, api, loadTasks]);

  useEffect(() => {
    if (!tokens.access || !selectedTaskId) return;
    loadSubtasks(selectedTaskId);
  }, [tokens.access, selectedTaskId, loadSubtasks]);

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
      // clear local tokens regardless of logout response
    } finally {
      const empty = { access: "", refresh: "" };
      setTokens(empty);
      writeStoredTokens(empty);
      setProfile(null);
      setTasks([]);
      setSelectedTaskId(null);
      setSubtasks([]);
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
      <p>
        <button onClick={handleLogout}>Log out</button>
      </p>
      {bootError && <p>{bootError}</p>}
      {bootLoading && <p>Loading workspace...</p>}

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
    </main>
  );
}

export default App;

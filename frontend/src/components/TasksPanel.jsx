import { PRIORITIES, STATUSES, toKebab } from "../constants";

function TasksPanel({
  taskForm,
  setTaskForm,
  taskCreateBusy,
  taskCreateError,
  onTaskCreate,
  tasks,
  tasksLoading,
  tasksError,
  selectedTaskId,
  setSelectedTaskId,
  onRefreshTasks,
}) {
  return (
    <section className="panel panel--tasks">
      <div className="panel-head">
        <h2>Create Task</h2>
      </div>
      <form className="form-grid" onSubmit={onTaskCreate}>
        <label className="field">
          <span>Title</span>
          <input
            placeholder="Sprint demo preparation"
            value={taskForm.title}
            onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
        </label>
        <label className="field">
          <span>Deadline</span>
          <input
            type="date"
            value={taskForm.deadline}
            onChange={(event) => setTaskForm((prev) => ({ ...prev, deadline: event.target.value }))}
            required
          />
        </label>
        <div className="row two-col">
          <label className="field">
            <span>Priority</span>
            <select
              value={taskForm.priority}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, priority: event.target.value }))}
            >
              {PRIORITIES.map((priority) => (
                <option key={priority}>{priority}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select
              value={taskForm.status}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, status: event.target.value }))}
            >
              {STATUSES.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          <span>Description</span>
          <textarea
            placeholder="Describe the goal, scope, and acceptance criteria."
            rows={3}
            value={taskForm.description}
            onChange={(event) => setTaskForm((prev) => ({ ...prev, description: event.target.value }))}
          />
        </label>
        {taskCreateError && <p className="feedback feedback--error">{taskCreateError}</p>}
        <button disabled={taskCreateBusy}>{taskCreateBusy ? "Creating..." : "Create task"}</button>
      </form>

      <div className="panel-head">
        <h2>Tasks</h2>
        <button type="button" onClick={onRefreshTasks} disabled={tasksLoading}>
          Refresh tasks
        </button>
      </div>
      {tasksError && <p className="feedback feedback--error">{tasksError}</p>}
      {tasksLoading && <p className="feedback">Loading tasks...</p>}

      <ul className="item-list">
        {tasks.map((task) => (
          <li key={task.id} className={selectedTaskId === task.id ? "is-selected" : ""}>
            <button type="button" className="task-item" onClick={() => setSelectedTaskId(task.id)}>
              <span className="task-item__title">{task.title}</span>
              <span className="task-item__meta">
                <span className={`badge badge--priority-${toKebab(task.priority)}`}>{task.priority}</span>
                <span className={`badge badge--status-${toKebab(task.status)}`}>{task.status}</span>
              </span>
            </button>
          </li>
        ))}
        {!tasks.length && !tasksLoading && <li>No tasks yet.</li>}
      </ul>
    </section>
  );
}

export default TasksPanel;

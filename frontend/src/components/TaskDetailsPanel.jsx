import { PRIORITIES, STATUSES } from "../constants";

function TaskDetailsPanel({
  selectedTask,
  taskEditForm,
  setTaskEditForm,
  taskEditBusy,
  taskEditError,
  onTaskUpdate,
  onTaskDelete,
}) {
  if (!selectedTask) {
    return (
      <section className="panel panel--details">
        <h2>Task Details</h2>
        <p className="feedback">Select a task from the list.</p>
      </section>
    );
  }

  return (
    <section className="panel panel--details">
      <div className="panel-head">
        <h2>Task Details</h2>
        <button type="button" className="danger-button" onClick={onTaskDelete}>
          Delete task
        </button>
      </div>

      <form className="form-grid" onSubmit={onTaskUpdate}>
        <label className="field">
          <span>Title</span>
          <input
            placeholder="Task title"
            value={taskEditForm.title}
            onChange={(event) => setTaskEditForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
        </label>
        <label className="field">
          <span>Deadline</span>
          <input
            type="date"
            value={taskEditForm.deadline}
            onChange={(event) => setTaskEditForm((prev) => ({ ...prev, deadline: event.target.value }))}
            required
          />
        </label>
        <div className="row two-col">
          <label className="field">
            <span>Priority</span>
            <select
              value={taskEditForm.priority}
              onChange={(event) => setTaskEditForm((prev) => ({ ...prev, priority: event.target.value }))}
            >
              {PRIORITIES.map((priority) => (
                <option key={priority}>{priority}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select
              value={taskEditForm.status}
              onChange={(event) => setTaskEditForm((prev) => ({ ...prev, status: event.target.value }))}
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
            placeholder="Task description"
            rows={3}
            value={taskEditForm.description}
            onChange={(event) => setTaskEditForm((prev) => ({ ...prev, description: event.target.value }))}
          />
        </label>
        {taskEditError && <p className="feedback feedback--error">{taskEditError}</p>}
        <button disabled={taskEditBusy}>{taskEditBusy ? "Saving..." : "Save changes"}</button>
      </form>
    </section>
  );
}

export default TaskDetailsPanel;

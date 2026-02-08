import { STATUSES, toKebab } from "../constants";

function SubtasksPanel({
  selectedTask,
  subtasks,
  subtasksLoading,
  subtasksError,
  subtaskForm,
  setSubtaskForm,
  subtaskBusy,
  subtaskError,
  onSubtaskCreate,
  onSubtaskStatusChange,
  onSubtaskDelete,
  onRefreshSubtasks,
}) {
  return (
    <section className="panel panel--subtasks">
      <div className="panel-head">
        <h2>Subtasks</h2>
        {selectedTask && (
          <button type="button" onClick={() => onRefreshSubtasks(selectedTask.id)}>
            Refresh subtasks
          </button>
        )}
      </div>

      {subtasksError && <p className="feedback feedback--error">{subtasksError}</p>}
      {subtasksLoading && <p className="feedback">Loading subtasks...</p>}

      {selectedTask && (
        <form className="form-grid" onSubmit={onSubtaskCreate}>
          <label className="field">
            <span>Subtask title</span>
            <input
              placeholder="Prepare changelog"
              value={subtaskForm.title}
              onChange={(event) => setSubtaskForm((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
          </label>
          <div className="row two-col">
            <label className="field">
              <span>Status</span>
              <select
                value={subtaskForm.status}
                onChange={(event) => setSubtaskForm((prev) => ({ ...prev, status: event.target.value }))}
              >
                {STATUSES.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Description</span>
              <input
                placeholder="Short note"
                value={subtaskForm.description}
                onChange={(event) =>
                  setSubtaskForm((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </label>
          </div>
          {subtaskError && <p className="feedback feedback--error">{subtaskError}</p>}
          <button disabled={subtaskBusy}>{subtaskBusy ? "Adding..." : "Add subtask"}</button>
        </form>
      )}

      <ul className="item-list">
        {subtasks.map((subtask) => (
          <li key={subtask.id}>
            <div className="split-row">
              <span className="item-title">{subtask.title}</span>
              <span className={`badge badge--status-${toKebab(subtask.status)}`}>{subtask.status}</span>
            </div>
            <div className="row two-col">
              <label className="field compact-field">
                <span>Update status</span>
                <select
                  value={subtask.status}
                  onChange={(event) => onSubtaskStatusChange(subtask.id, event.target.value)}
                >
                  {STATUSES.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="danger-button subtle-danger"
                onClick={() => onSubtaskDelete(subtask.id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
        {!subtasks.length && !subtasksLoading && <li>No subtasks yet.</li>}
      </ul>
    </section>
  );
}

export default SubtasksPanel;

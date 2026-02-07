const STATUSES = ["To do", "In progress", "Done"];

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
    <section>
      <h2>Subtasks</h2>
      {selectedTask && (
        <p>
          <button onClick={() => onRefreshSubtasks(selectedTask.id)}>Refresh subtasks</button>
        </p>
      )}
      {subtasksError && <p>{subtasksError}</p>}
      {subtasksLoading && <p>Loading subtasks...</p>}

      {selectedTask && (
        <form onSubmit={onSubtaskCreate}>
          <p>
            <input
              placeholder="Subtask title"
              value={subtaskForm.title}
              onChange={(event) => setSubtaskForm((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
          </p>
          <p>
            <select
              value={subtaskForm.status}
              onChange={(event) => setSubtaskForm((prev) => ({ ...prev, status: event.target.value }))}
            >
              {STATUSES.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </p>
          <p>
            <input
              placeholder="Subtask description"
              value={subtaskForm.description}
              onChange={(event) =>
                setSubtaskForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
          </p>
          {subtaskError && <p>{subtaskError}</p>}
          <button disabled={subtaskBusy}>{subtaskBusy ? "Adding..." : "Add subtask"}</button>
        </form>
      )}

      <ul>
        {subtasks.map((subtask) => (
          <li key={subtask.id}>
            {subtask.title}{" "}
            <select
              value={subtask.status}
              onChange={(event) => onSubtaskStatusChange(subtask.id, event.target.value)}
            >
              {STATUSES.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>{" "}
            <button onClick={() => onSubtaskDelete(subtask.id)}>Delete</button>
          </li>
        ))}
        {!subtasks.length && !subtasksLoading && <li>No subtasks yet.</li>}
      </ul>
    </section>
  );
}

export default SubtasksPanel;

const PRIORITIES = ["High", "Medium", "Low"];
const STATUSES = ["To do", "In progress", "Done"];

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
      <section>
        <h2>Task details</h2>
        <p>Select a task from the list.</p>
      </section>
    );
  }

  return (
    <section>
      <h2>Task details</h2>
      <p>
        <button onClick={onTaskDelete}>Delete task</button>
      </p>

      <form onSubmit={onTaskUpdate}>
        <p>
          <input
            placeholder="Title"
            value={taskEditForm.title}
            onChange={(event) => setTaskEditForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
        </p>
        <p>
          <input
            type="date"
            value={taskEditForm.deadline}
            onChange={(event) => setTaskEditForm((prev) => ({ ...prev, deadline: event.target.value }))}
            required
          />
        </p>
        <p>
          <select
            value={taskEditForm.priority}
            onChange={(event) => setTaskEditForm((prev) => ({ ...prev, priority: event.target.value }))}
          >
            {PRIORITIES.map((priority) => (
              <option key={priority}>{priority}</option>
            ))}
          </select>
        </p>
        <p>
          <select
            value={taskEditForm.status}
            onChange={(event) => setTaskEditForm((prev) => ({ ...prev, status: event.target.value }))}
          >
            {STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </p>
        <p>
          <textarea
            placeholder="Description"
            rows={3}
            value={taskEditForm.description}
            onChange={(event) => setTaskEditForm((prev) => ({ ...prev, description: event.target.value }))}
          />
        </p>
        {taskEditError && <p>{taskEditError}</p>}
        <button disabled={taskEditBusy}>{taskEditBusy ? "Saving..." : "Save changes"}</button>
      </form>
    </section>
  );
}

export default TaskDetailsPanel;

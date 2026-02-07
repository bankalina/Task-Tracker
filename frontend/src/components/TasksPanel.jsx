const PRIORITIES = ["High", "Medium", "Low"];
const STATUSES = ["To do", "In progress", "Done"];

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
    <section>
      <h2>Create task</h2>
      <form onSubmit={onTaskCreate}>
        <p>
          <input
            placeholder="Title"
            value={taskForm.title}
            onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
        </p>
        <p>
          <input
            type="date"
            value={taskForm.deadline}
            onChange={(event) => setTaskForm((prev) => ({ ...prev, deadline: event.target.value }))}
            required
          />
        </p>
        <p>
          <select
            value={taskForm.priority}
            onChange={(event) => setTaskForm((prev) => ({ ...prev, priority: event.target.value }))}
          >
            {PRIORITIES.map((priority) => (
              <option key={priority}>{priority}</option>
            ))}
          </select>
        </p>
        <p>
          <select
            value={taskForm.status}
            onChange={(event) => setTaskForm((prev) => ({ ...prev, status: event.target.value }))}
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
            value={taskForm.description}
            onChange={(event) => setTaskForm((prev) => ({ ...prev, description: event.target.value }))}
          />
        </p>
        {taskCreateError && <p>{taskCreateError}</p>}
        <button disabled={taskCreateBusy}>{taskCreateBusy ? "Creating..." : "Create task"}</button>
      </form>

      <h2>Tasks</h2>
      <p>
        <button onClick={onRefreshTasks} disabled={tasksLoading}>
          Refresh tasks
        </button>
      </p>
      {tasksError && <p>{tasksError}</p>}
      {tasksLoading && <p>Loading tasks...</p>}

      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <button onClick={() => setSelectedTaskId(task.id)}>
              {selectedTaskId === task.id ? "* " : ""}
              {task.title} | {task.priority} | {task.status}
            </button>
          </li>
        ))}
        {!tasks.length && !tasksLoading && <li>No tasks yet.</li>}
      </ul>
    </section>
  );
}

export default TasksPanel;

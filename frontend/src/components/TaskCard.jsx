import api from "../api";

const statusOptions = [
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in-progress" },
  { label: "Done", value: "done" }
];

const priorityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High"
};

export default function TaskCard({ task, onChanged }) {
  // Highlight overdue tasks unless they're already done
  const isOverdue = task.status !== "done" && new Date(task.dueDate) < new Date();
  
  // Apply priority color styling to the card
  const priorityClass = `priority-${task.priority}`;

  const handleStatusChange = async (event) => {
    await api.patch(`/tasks/${task.id}`, { status: event.target.value });
    onChanged();
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this task?")) {
      return;
    }

    await api.delete(`/tasks/${task.id}`);
    onChanged();
  };

  return (
    <div className={`task-card ${priorityClass}${isOverdue ? " overdue" : ""}`}>
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      <p className={`priority-badge ${priorityClass}`}>{priorityLabels[task.priority]}</p>
      <p className="muted">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
      <div className="row">
        <div className="field">
          <label htmlFor={`status-${task.id}`}>Status</label>
          <select id={`status-${task.id}`} value={task.status} onChange={handleStatusChange}>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="actions" style={{ alignItems: "flex-end" }}>
          <button className="secondary" type="button" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
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
  const [commentDraft, setCommentDraft] = useState(task.comments || "");
  const [savingComments, setSavingComments] = useState(false);
  const [commentMessage, setCommentMessage] = useState("");

  const dueDateValue = task.dueDate.slice(0, 10);
  const todayValue = new Date().toISOString().slice(0, 10);
  const isOverdue = task.status !== "done" && dueDateValue < todayValue;

  const priorityClass = `priority-${task.priority}`;

  useEffect(() => {
    setCommentDraft(task.comments || "");
    setCommentMessage("");
    setSavingComments(false);
  }, [task.comments, task.id, task.status]);

  const handleStatusChange = async (event) => {
    await api.patch(`/tasks/${task.id}`, { status: event.target.value });
    onChanged();
  };

  const handleCommentSave = async (event) => {
    event.preventDefault();

    setSavingComments(true);
    setCommentMessage("");

    try {
      await api.patch(`/tasks/${task.id}`, {
        comments: commentDraft.trim()
      });
      onChanged();
    } catch (err) {
      setCommentMessage(err.response?.data?.message || "Unable to save comments");
    } finally {
      setSavingComments(false);
    }
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
      <div className="task-card-header">
        <h3>{task.title}</h3>
        {isOverdue ? <span className="task-status-badge overdue-badge">Overdue</span> : null}
      </div>
      <p>{task.description}</p>
      <p className={`priority-badge ${priorityClass}`}>{priorityLabels[task.priority]}</p>
      <p className="muted">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
      {task.status === "in-progress" ? (
        <form className="comment-section stack" onSubmit={handleCommentSave}>
          <div className="field">
            <label htmlFor={`comments-${task.id}`}>Comments and extra details</label>
            <textarea
              id={`comments-${task.id}`}
              rows="4"
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              placeholder="Add updates, blockers, or extra details while this task is in progress"
            />
          </div>
          <div className="actions">
            <button className="secondary" type="submit" disabled={savingComments}>
              {savingComments ? "Saving..." : "Save comments"}
            </button>
            <span className="muted">Visible while the task is in progress.</span>
            {commentMessage ? <span className="muted">{commentMessage}</span> : null}
          </div>
        </form>
      ) : null}
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

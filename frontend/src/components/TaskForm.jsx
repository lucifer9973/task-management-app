import { useState } from "react";
import api from "../api";

const initialForm = {
  title: "",
  description: "",
  priority: "medium",
  dueDate: ""
};

export default function TaskForm({ onCreated }) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const today = new Date();
  const minDueDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

  const isValidDueDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const parsedDate = new Date(`${value}T00:00:00.000Z`);

    return (
      !Number.isNaN(parsedDate.getTime()) &&
      parsedDate.toISOString().startsWith(value) &&
      value >= minDueDate
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isValidDueDate(form.dueDate)) {
      setMessage("Select today or a future due date");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      await api.post("/tasks", form);
      setForm(initialForm);
      setMessage("Task created");
      onCreated();
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to create task");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="stack">
      <h2>Create Task Form</h2>
      <div className="row">
        <div className="field">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            value={form.priority}
            onChange={(event) => setForm({ ...form, priority: event.target.value })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="dueDate">Due Date</label>
          <input
            id="dueDate"
            type="date"
            min={minDueDate}
            max="9999-12-31"
            value={form.dueDate}
            onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
            required
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          rows="3"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          required
        />
      </div>
      <div className="actions">
        <button className="primary" type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Create Task"}
        </button>
        {message ? <span className="muted">{message}</span> : null}
      </div>
    </form>
  );
}

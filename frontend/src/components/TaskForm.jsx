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

  const updateField = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value });
    if (message) {
      setMessage("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const title = form.title.trim();
    const description = form.description.trim();
    const dueDate = form.dueDate.trim();

    if (!title || !description || !dueDate) {
      setMessage("Fill in the title, description, and due date");
      return;
    }

    if (!isValidDueDate(dueDate)) {
      setMessage("Select today or a future due date");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      await api.post("/tasks", {
        ...form,
        title,
        description,
        dueDate
      });
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
    <form onSubmit={handleSubmit} className="stack" noValidate>
      <h2>Create Task Form</h2>
      <div className="row">
        <div className="field">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            value={form.title}
            onChange={updateField("title")}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            value={form.priority}
            onChange={updateField("priority")}
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
            onChange={updateField("dueDate")}
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
          onChange={updateField("description")}
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

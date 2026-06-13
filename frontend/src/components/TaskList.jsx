import TaskCard from "./TaskCard";

export default function TaskList({ tasks, onChanged }) {
  if (!tasks.length) {
    return <p className="muted">No tasks found.</p>;
  }

  return (
    <div className="stack">
      <h2>Task List</h2>
      <div className="stack">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onChanged={onChanged} />
        ))}
      </div>
    </div>
  );
}

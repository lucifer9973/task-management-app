export default function Summary({ summary, selectedStatus, onSelectStatus }) {
  return (
    <div className="stack">
      <h2>Summary</h2>
      <div className="cards">
        <button
          type="button"
          className={`summary-card summary-button${selectedStatus === "open" ? " active" : ""}`}
          onClick={() => onSelectStatus("open")}
        >
          <h3>Open</h3>
          <p>{summary.statusCounts.open}</p>
        </button>
        <button
          type="button"
          className={`summary-card summary-button${selectedStatus === "in-progress" ? " active" : ""}`}
          onClick={() => onSelectStatus("in-progress")}
        >
          <h3>In Progress</h3>
          <p>{summary.statusCounts["in-progress"]}</p>
        </button>
        <button
          type="button"
          className={`summary-card summary-button${selectedStatus === "done" ? " active" : ""}`}
          onClick={() => onSelectStatus("done")}
        >
          <h3>Done</h3>
          <p>{summary.statusCounts.done}</p>
        </button>
      </div>
    </div>
  );
}

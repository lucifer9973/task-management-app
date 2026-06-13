import { useEffect, useState } from "react";
import api from "../api";
import TaskForm from "./TaskForm";
import Filters from "./Filters";
import Summary from "./Summary";
import TaskList from "./TaskList";

const defaultFilters = {
  status: "",
  priority: ""
};

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState({
    statusCounts: { open: 0, "in-progress": 0, done: 0 },
    priorityCounts: { high: 0, medium: 0, low: 0 }
  });
  const [selectedStatus, setSelectedStatus] = useState("open");
  const [filters, setFilters] = useState(defaultFilters);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // The "Open" view shows both open and in-progress tasks
  // Other views (In Progress, Done) show exact status matches
  const doesTaskMatchSelectedStatus = (taskStatus) => {
    if (selectedStatus === "open") {
      return taskStatus === "open" || taskStatus === "in-progress";
    }

    return taskStatus === selectedStatus;
  };

  // Apply client-side filtering based on selected status view
  const displayedTasks = tasks.filter((task) => doesTaskMatchSelectedStatus(task.status));

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        const params = {};

        if (filters.priority) {
          params.priority = filters.priority;
        }

        const [tasksResponse, summaryResponse] = await Promise.all([
          api.get("/tasks", { params }),
          api.get("/tasks/summary")
        ]);

        setTasks(tasksResponse.data.data || []);
        setSummary(summaryResponse.data);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load tasks");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filters, reloadKey, selectedStatus]);

  const refresh = () => setReloadKey((value) => value + 1);

  const handleFiltersChange = (nextFilters) => {
    setFilters(nextFilters);

    if (nextFilters.status) {
      setSelectedStatus(nextFilters.status);
    }
  };

  const handleSelectStatus = (status) => {
    setSelectedStatus(status);
    setFilters((currentFilters) => ({
      ...currentFilters,
      status
    }));
  };

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Task Dashboard</h1>
          <p className="muted">Create, filter, update, and delete tasks.</p>
        </div>
      </div>

      <div className="section stack">
        <TaskForm onCreated={refresh} />
      </div>

      <div className="section stack">
        <Filters filters={filters} onChange={handleFiltersChange} />
      </div>

      <div className="section stack">
        <Summary summary={summary} selectedStatus={selectedStatus} onSelectStatus={handleSelectStatus} />
      </div>

      <div className="section stack">
        {error ? <p className="muted">{error}</p> : null}
        {loading ? (
          <p className="muted">Loading tasks...</p>
        ) : (
          <TaskList tasks={displayedTasks} onChanged={refresh} />
        )}
      </div>
    </div>
  );
}

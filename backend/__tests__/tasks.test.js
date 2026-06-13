const request = require("supertest");

const app = require("../server");
const db = require("../db");

describe("POST /tasks", () => {
  afterAll((done) => {
    db.close(done);
  });

  it("creates a task", async () => {
    const response = await request(app).post("/tasks").send({
      title: "Assignment",
      description: "Finish project",
      priority: "high",
      dueDate: "2026-06-15"
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      title: "Assignment",
      description: "Finish project",
      priority: "high",
      status: "open"
    });
    expect(response.body.data.id).toBeDefined();
  });

  it("saves comments for tasks in progress", async () => {
    const createResponse = await request(app).post("/tasks").send({
      title: "Review draft",
      description: "Check the latest notes",
      priority: "medium",
      dueDate: "2026-06-16"
    });

    const taskId = createResponse.body.data.id;

    await request(app).patch(`/tasks/${taskId}`).send({ status: "in-progress" });

    const commentResponse = await request(app).patch(`/tasks/${taskId}`).send({
      comments: "Waiting on feedback from design before finishing the task."
    });

    expect(commentResponse.status).toBe(200);
    expect(commentResponse.body.success).toBe(true);
    expect(commentResponse.body.data.comments).toBe(
      "Waiting on feedback from design before finishing the task."
    );
  });
});

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
});

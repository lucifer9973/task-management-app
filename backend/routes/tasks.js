const express = require("express");
const { randomUUID } = require("crypto");
const Joi = require("joi");

const db = require("../db");

const router = express.Router();

// Validation schema for new task creation
const createTaskSchema = Joi.object({
	title: Joi.string().trim().required(),
	description: Joi.string().trim().required(),
	priority: Joi.string().valid("low", "medium", "high").required(),
	dueDate: Joi.string()
		.pattern(/^\d{4}-\d{2}-\d{2}$/)
		.custom((value, helpers) => {
			// Ensure the date string represents a valid date (e.g., reject Feb 30)
			const parsedDate = new Date(`${value}T00:00:00.000Z`);

			if (Number.isNaN(parsedDate.getTime())) {
				return helpers.error("date.invalid");
			}

			// Verify the parsed date matches the input (catches invalid dates like 2026-02-30)
			const [year, month, day] = value.split("-").map(Number);

			if (
				parsedDate.getUTCFullYear() !== year ||
				parsedDate.getUTCMonth() + 1 !== month ||
				parsedDate.getUTCDate() !== day
			) {
				return helpers.error("date.invalid");
			}

			return value;
		}, "date validation")
		.required()
});

// Tasks can only transition through this workflow: open -> in-progress -> done
// This prevents jumping states out of order
const allowedTransitions = {
	open: "in-progress",
	"in-progress": "done"
};

function queryAll(sql, params = []) {
	return new Promise((resolve, reject) => {
		db.all(sql, params, (err, rows) => {
			if (err) {
				reject(err);
			} else {
				resolve(rows);
			}
		});
	});
}

function queryGet(sql, params = []) {
	return new Promise((resolve, reject) => {
		db.get(sql, params, (err, row) => {
			if (err) {
				reject(err);
			} else {
				resolve(row);
			}
		});
	});
}

function run(sql, params = []) {
	return new Promise((resolve, reject) => {
		db.run(sql, params, function runCallback(err) {
			if (err) {
				reject(err);
			} else {
				resolve(this);
			}
		});
	});
}

router.post("/", async (req, res, next) => {
	try {
		// Reject incomplete requests before touching the database
		const { error, value } = createTaskSchema.validate(req.body, { abortEarly: false });

		if (error) {
			return res.status(400).json({
				success: false,
				message: error.details.map((detail) => detail.message).join(", ")
			});
		}

		// New tasks always start in the "open" state
		const task = {
			id: randomUUID(),
			title: value.title,
			description: value.description,
			priority: value.priority,
			status: "open",
			dueDate: new Date(`${value.dueDate}T00:00:00.000Z`).toISOString(),
			createdAt: new Date().toISOString()
		};

		await run(
			`
				INSERT INTO tasks (id, title, description, priority, status, dueDate, createdAt)
				VALUES (?, ?, ?, ?, ?, ?, ?)
			`,
			[task.id, task.title, task.description, task.priority, task.status, task.dueDate, task.createdAt]
		);

		res.status(201).json({ success: true, data: task });
	} catch (err) {
		next(err);
	}
});

router.get("/summary", async (req, res, next) => {
	try {
		const rows = await queryAll("SELECT status, priority FROM tasks");

		const statusCounts = { open: 0, "in-progress": 0, done: 0 };
		const priorityCounts = { high: 0, medium: 0, low: 0 };

		rows.forEach((row) => {
			if (statusCounts[row.status] !== undefined) {
				statusCounts[row.status] += 1;
			}

			if (priorityCounts[row.priority] !== undefined) {
				priorityCounts[row.priority] += 1;
			}
		});

		res.json({ statusCounts, priorityCounts });
	} catch (err) {
		next(err);
	}
});

router.get("/", async (req, res, next) => {
	try {
		const filters = [];
		const values = [];

		if (req.query.status) {
			filters.push("status = ?");
			values.push(req.query.status);
		}

		if (req.query.priority) {
			filters.push("priority = ?");
			values.push(req.query.priority);
		}

		const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
		const tasks = await queryAll(`SELECT * FROM tasks ${whereClause} ORDER BY createdAt DESC`, values);

		res.json({ success: true, data: tasks });
	} catch (err) {
		next(err);
	}
});

router.patch("/:id", async (req, res, next) => {
	try {
		const { status } = req.body;

		// Reject unknown status values
		if (!["open", "in-progress", "done"].includes(status)) {
			return res.status(400).json({
				success: false,
				message: "Invalid status transition"
			});
		}

		const task = await queryGet("SELECT * FROM tasks WHERE id = ?", [req.params.id]);

		if (!task) {
			return res.status(404).json({
				success: false,
				message: "Task not found"
			});
		}

		// If already in the target status, no update needed
		if (task.status === status) {
			return res.json({ success: true, data: task });
		}

		// Keep status changes sequential: open -> in-progress -> done
		// This prevents skipping steps in the workflow
		if (allowedTransitions[task.status] !== status) {
			return res.status(400).json({
				success: false,
				message: "Invalid status transition"
			});
		}

		await run("UPDATE tasks SET status = ? WHERE id = ?", [status, req.params.id]);
		const updatedTask = await queryGet("SELECT * FROM tasks WHERE id = ?", [req.params.id]);

		res.json({ success: true, data: updatedTask });
	} catch (err) {
		next(err);
	}
});

router.delete("/:id", async (req, res, next) => {
	try {
		const result = await run("DELETE FROM tasks WHERE id = ?", [req.params.id]);

		if (result.changes === 0) {
			return res.status(404).json({
				success: false,
				message: "Task not found"
			});
		}

		res.json({
			success: true,
			message: "Task deleted"
		});
	} catch (err) {
		next(err);
	}
});

module.exports = router;

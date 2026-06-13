const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./tasks.db", (err) => {
	if (err) {
		console.error("Database connection failed", err.message);
	} else {
		console.log("SQLite Connected");
	}
});

db.serialize(() => {
	db.run(`
		CREATE TABLE IF NOT EXISTS tasks (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			description TEXT NOT NULL,
			priority TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'open',
			dueDate TEXT NOT NULL,
			createdAt TEXT NOT NULL,
			comments TEXT NOT NULL DEFAULT ''
		)
	`);

	db.run("ALTER TABLE tasks ADD COLUMN comments TEXT NOT NULL DEFAULT ''", (err) => {
		if (err && !/duplicate column name/i.test(err.message)) {
			console.error("Failed to add comments column", err.message);
		}
	});
});

module.exports = db;

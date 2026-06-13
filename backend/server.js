const express = require("express");
const cors = require("cors");

const taskRoutes = require("./routes/tasks");
const errorHandler = require("./middleware/errorHandler");

require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/tasks", taskRoutes);

app.get("/", (req, res) => {
	res.json({
		success: true,
		message: "Task API Running"
	});
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
	app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	});
}

module.exports = app;

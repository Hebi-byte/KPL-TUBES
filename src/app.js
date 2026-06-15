const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();

const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

const userRoutes = require("./Routes/userRoutes");
const projectRoutes = require("./Routes/projectRoutes");
const taskRoutes = require("./Routes/taskRoutes");
const statusRoutes = require("./Routes/statusRoutes");
const rolesRoutes = require("./Routes/rolesRoutes");
const workflowRoutes = require("./Routes/workflowRoutes");
const authRoutes = require("./Routes/authRoutes");

const publicPath = path.join(__dirname, "../Public");

app.use(express.json());
app.use(express.static(publicPath));
// Logger masuk sebelum routes, biar semua request tercatat
app.use(logger);

app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/statuses", statusRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/workflows", workflowRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(publicPath, "login.html"));
});

app.get(["/dashboard", "/projects/:id"], (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

app.get(/^\/(?!api|test-db|test-env|login|dashboard|projects).*/, (req, res) => {
  res.redirect("/login");
});
// Error handler masuk setelah semua routes, biar bisa tangkap error dari mana saja
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});

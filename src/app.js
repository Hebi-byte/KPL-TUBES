const express = require("express");
const path = require("path");
const db = require("./config/database");

const userRoutes = require("./Routes/userRoutes");
const projectRoutes = require("./Routes/projectRoutes");
const taskRoutes = require("./Routes/taskRoutes");
const statusRoutes = require("./Routes/statusRoutes");
const rolesRoutes = require("./Routes/rolesRoutes");
const workflowRoutes = require("./Routes/workflowRoutes");
const historyRoutes = require("./Routes/historyRoutes");
const authRoutes = require("./Routes/authRoutes");



require("dotenv").config();

const app = express();

app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/statuses", statusRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/workflows", workflowRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/auth", authRoutes);


app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/login.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.get(/^\/(?!api|test-db|test-env|login|dashboard).*/, (req, res) => {
  res.redirect("/login");
});

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});


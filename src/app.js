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
const commitRoutes = require("./Routes/commitRoutes");

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
app.use("/api/commits", commitRoutes);

// tarik file frontend dari folder public
app.use(express.static(path.join(__dirname, "../public")));

// route utama selalu buka index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.get("/test", (req, res) => {
  const { sendSuccess, sendError } = require("./utils/response");
  sendSuccess(res, { nama: "Budi", umur: 20 }, "Ini dari response.js milikku");
});

// supaya refresh di /dashboard, /projects, dll tetap balik ke index.html
app.get(/^\/(?!api|test-db|test-env).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});


const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});


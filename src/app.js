const express = require("express");
const path = require("path");
const db = require("./config/database");

require("dotenv").config();

const app = express();

app.use(express.json());

// tarik file frontend dari folder public
app.use(express.static(path.join(__dirname, "../public")));

// route utama selalu buka index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// supaya refresh di /dashboard, /projects, dll tetap balik ke index.html
app.get(/^\/(?!api|test-db|test-env).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});


const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});

app.get("/test", (req, res) => {
  const { sendSuccess, sendError } = require("./utils/response");
  sendSuccess(res, { nama: "Budi", umur: 20 }, "Ini dari response.js milikku");
});
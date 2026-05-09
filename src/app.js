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

app.get("/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 + 1 AS hasil");

    res.json({
      message: "Database berhasil terkoneksi",
      hasil: rows[0].hasil
    });
  } catch (error) {
    res.status(500).json({
      message: "Database gagal terkoneksi",
      error: error.message
    });
  }
});

app.get("/test-env", (req, res) => {
  res.json({
    PORT: process.env.PORT,
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD === "" ? "kosong" : "ada isi",
    DB_NAME: process.env.DB_NAME,
    JWT_SECRET: process.env.JWT_SECRET ? "terbaca" : "tidak terbaca"
  });
});

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});

app.get("/test", (req, res) => {
  const { sendSuccess, sendError } = require("./utils/response");
  sendSuccess(res, { nama: "Budi", umur: 20 }, "Ini dari response.js milikku");
});
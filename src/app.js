const express = require("express");
const db = require("./config/database");
const path = require("path");
require("dotenv").config();


const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.send("API KPL Tubes berjalan");
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


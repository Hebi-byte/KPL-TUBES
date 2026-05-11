const db = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "username dan password wajib diisi",
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        u.id_user,
        u.nama_user,
        u.email,
        u.password,
        u.id_role,
        r.nama_role
      FROM users u
      LEFT JOIN roles r ON u.id_role = r.id_role
      WHERE LOWER(TRIM(u.nama_user)) = LOWER(TRIM(?))
      `,
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: "Username atau password salah",
      });
    }

    const user = rows[0];

    let isPasswordValid = false;

    // Kalau password di database sudah bcrypt hash, pakai bcrypt.compare.
    // Kalau data lama masih plaintext, bandingkan langsung supaya tetap bisa login.
    if (user.password && user.password.startsWith("$2")) {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      isPasswordValid = password === user.password;
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Username atau password salah",
      });
    }

    const token = jwt.sign(
      {
        id_user: user.id_user,
        email: user.email,
        id_role: user.id_role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    delete user.password;

    res.status(200).json({
      message: "Login berhasil",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal login",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

module.exports = {
  login,
};
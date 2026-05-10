const db = require("../config/database");
const bcrypt = require("bcrypt");

const getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        u.id_user,
        u.nama_user,
        u.email,
        u.id_role,
        r.nama_role
      FROM users u
      LEFT JOIN roles r ON u.id_role = r.id_role
      ORDER BY u.id_user DESC
    `);

    res.status(200).json({
      message: "Berhasil mengambil data users",
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data users",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `
      SELECT
        u.id_user,
        u.nama_user,
        u.email,
        u.id_role,
        r.nama_role
      FROM users u
      LEFT JOIN roles r ON u.id_role = r.id_role
      WHERE u.id_user = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    res.status(200).json({
      message: "Berhasil mengambil detail user",
      data: rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil detail user",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

const createUser = async (req, res) => {
  try {
    const { nama_user, email, password, id_role } = req.body;

    if (!nama_user || !email || !password || !id_role) {
      return res.status(400).json({
        message: "nama_user, email, password, dan id_role wajib diisi",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      "INSERT INTO users (nama_user, email, password, id_role) VALUES (?, ?, ?, ?)",
      [nama_user, email, hashedPassword, id_role]
    );

    res.status(201).json({
      message: "User berhasil dibuat",
      data: {
        id_user: result.insertId,
        nama_user,
        email,
        id_role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal membuat user",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_user, email, password, id_role } = req.body;

    if (!nama_user || !email || !id_role) {
      return res.status(400).json({
        message: "nama_user, email, dan id_role wajib diisi",
      });
    }

    let query = `
      UPDATE users
      SET nama_user = ?, email = ?, id_role = ?
      WHERE id_user = ?
    `;
    let values = [nama_user, email, id_role, id];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);

      query = `
        UPDATE users
        SET nama_user = ?, email = ?, password = ?, id_role = ?
        WHERE id_user = ?
      `;
      values = [nama_user, email, hashedPassword, id_role, id];
    }

    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    res.status(200).json({
      message: "User berhasil diupdate",
      data: {
        id_user: Number(id),
        nama_user,
        email,
        id_role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengupdate user",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "DELETE FROM users WHERE id_user = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    res.status(200).json({
      message: "User berhasil dihapus",
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal menghapus user",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
const db = require("../config/database");

const getAllRoles = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM roles ORDER BY id_role ASC");

    res.status(200).json({
      message: "Berhasil mengambil data roles",
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data roles",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM roles WHERE id_role = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Role tidak ditemukan",
      });
    }

    res.status(200).json({
      message: "Berhasil mengambil detail role",
      data: rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil detail role",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

const createRole = async (req, res) => {
  try {
    const { nama_role } = req.body;

    if (!nama_role) {
      return res.status(400).json({
        message: "nama_role wajib diisi",
      });
    }

    const [result] = await db.query(
      "INSERT INTO roles (nama_role) VALUES (?)",
      [nama_role]
    );

    res.status(201).json({
      message: "Role berhasil dibuat",
      data: {
        id_role: result.insertId,
        nama_role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal membuat role",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_role } = req.body;

    if (!nama_role) {
      return res.status(400).json({
        message: "nama_role wajib diisi",
      });
    }

    const [result] = await db.query(
      "UPDATE roles SET nama_role = ? WHERE id_role = ?",
      [nama_role, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Role tidak ditemukan",
      });
    }

    res.status(200).json({
      message: "Role berhasil diupdate",
      data: {
        id_role: Number(id),
        nama_role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengupdate role",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "DELETE FROM roles WHERE id_role = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Role tidak ditemukan",
      });
    }

    res.status(200).json({
      message: "Role berhasil dihapus",
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal menghapus role",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};
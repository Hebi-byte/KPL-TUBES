const db = require("../config/database");

const getAllStatuses = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM statuses ORDER BY urutan_status ASC"
    );

    res.status(200).json({
      message: "Berhasil mengambil data statuses",
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data statuses",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

const getStatusById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM statuses WHERE id_status = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Status tidak ditemukan",
      });
    }

    res.status(200).json({
      message: "Berhasil mengambil detail status",
      data: rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil detail status",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

const createStatus = async (req, res) => {
  try {
    const { nama_status, urutan_status } = req.body;

    if (!nama_status || urutan_status === undefined) {
      return res.status(400).json({
        message: "nama_status dan urutan_status wajib diisi",
      });
    }

    const [result] = await db.query(
      "INSERT INTO statuses (nama_status, urutan_status) VALUES (?, ?)",
      [nama_status, urutan_status]
    );

    res.status(201).json({
      message: "Status berhasil dibuat",
      data: {
        id_status: result.insertId,
        nama_status,
        urutan_status,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal membuat status",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_status, urutan_status } = req.body;

    if (!nama_status || urutan_status === undefined) {
      return res.status(400).json({
        message: "nama_status dan urutan_status wajib diisi",
      });
    }

    const [result] = await db.query(
      "UPDATE statuses SET nama_status = ?, urutan_status = ? WHERE id_status = ?",
      [nama_status, urutan_status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Status tidak ditemukan",
      });
    }

    res.status(200).json({
      message: "Status berhasil diupdate",
      data: {
        id_status: Number(id),
        nama_status,
        urutan_status,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengupdate status",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

const deleteStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "DELETE FROM statuses WHERE id_status = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Status tidak ditemukan",
      });
    }

    res.status(200).json({
      message: "Status berhasil dihapus",
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal menghapus status",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

module.exports = {
  getAllStatuses,
  getStatusById,
  createStatus,
  updateStatus,
  deleteStatus,
};
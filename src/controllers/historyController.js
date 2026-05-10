const db = require("../config/database");

const getAllHistory = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        h.id_history,
        h.id_task,
        t.judul_task,
        h.status_sebelum,
        ss.nama_status AS nama_status_sebelum,
        h.status_sesudah,
        sb.nama_status AS nama_status_sesudah,
        h.changed_by,
        u.nama_user AS changed_by_name,
        h.changed_at
      FROM task_history h
      LEFT JOIN tasks t ON h.id_task = t.id_task
      LEFT JOIN statuses ss ON h.status_sebelum = ss.id_status
      LEFT JOIN statuses sb ON h.status_sesudah = sb.id_status
      LEFT JOIN users u ON h.changed_by = u.id_user
      ORDER BY h.id_history DESC
    `);

    res.status(200).json({
      message: "Berhasil mengambil data history",
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data history",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

const getHistoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `
      SELECT
        h.id_history,
        h.id_task,
        t.judul_task,
        h.status_sebelum,
        ss.nama_status AS nama_status_sebelum,
        h.status_sesudah,
        sb.nama_status AS nama_status_sesudah,
        h.changed_by,
        u.nama_user AS changed_by_name,
        h.changed_at
      FROM task_history h
      LEFT JOIN tasks t ON h.id_task = t.id_task
      LEFT JOIN statuses ss ON h.status_sebelum = ss.id_status
      LEFT JOIN statuses sb ON h.status_sesudah = sb.id_status
      LEFT JOIN users u ON h.changed_by = u.id_user
      WHERE h.id_history = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "History tidak ditemukan",
      });
    }

    res.status(200).json({
      message: "Berhasil mengambil detail history",
      data: rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil detail history",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

const createHistory = async (req, res) => {
  try {
    const { id_task, status_sebelum, status_sesudah, changed_by } = req.body;

    if (!id_task || !status_sesudah || !changed_by) {
      return res.status(400).json({
        message: "id_task, status_sesudah, dan changed_by wajib diisi",
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO task_history
      (id_task, status_sebelum, status_sesudah, changed_by)
      VALUES (?, ?, ?, ?)
      `,
      [id_task, status_sebelum || null, status_sesudah, changed_by]
    );

    res.status(201).json({
      message: "History berhasil dibuat",
      data: {
        id_history: result.insertId,
        id_task,
        status_sebelum: status_sebelum || null,
        status_sesudah,
        changed_by,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal membuat history",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

module.exports = {
  getAllHistory,
  getHistoryById,
  createHistory,
};
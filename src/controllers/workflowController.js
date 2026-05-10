const db = require("../config/database");

const getAllWorkflow = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        w.id_transisi,
        w.status_asal,
        sa.nama_status AS nama_status_asal,
        w.status_tujuan,
        st.nama_status AS nama_status_tujuan,
        w.id_role,
        r.nama_role,
        w.nama_aksi,
        w.is_active
      FROM workflow w
      LEFT JOIN statuses sa ON w.status_asal = sa.id_status
      LEFT JOIN statuses st ON w.status_tujuan = st.id_status
      LEFT JOIN roles r ON w.id_role = r.id_role
      ORDER BY w.id_transisi ASC
    `);

    res.status(200).json({
      message: "Berhasil mengambil data workflow",
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data workflow",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

const getWorkflowById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `
      SELECT
        w.id_transisi,
        w.status_asal,
        sa.nama_status AS nama_status_asal,
        w.status_tujuan,
        st.nama_status AS nama_status_tujuan,
        w.id_role,
        r.nama_role,
        w.nama_aksi,
        w.is_active
      FROM workflow w
      LEFT JOIN statuses sa ON w.status_asal = sa.id_status
      LEFT JOIN statuses st ON w.status_tujuan = st.id_status
      LEFT JOIN roles r ON w.id_role = r.id_role
      WHERE w.id_transisi = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Workflow tidak ditemukan",
      });
    }

    res.status(200).json({
      message: "Berhasil mengambil detail workflow",
      data: rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil detail workflow",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

const createWorkflow = async (req, res) => {
  try {
    const { status_asal, status_tujuan, id_role, nama_aksi, is_active } =
      req.body;

    if (!status_asal || !status_tujuan || !id_role || !nama_aksi) {
      return res.status(400).json({
        message: "status_asal, status_tujuan, id_role, dan nama_aksi wajib diisi",
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO workflow
      (status_asal, status_tujuan, id_role, nama_aksi, is_active)
      VALUES (?, ?, ?, ?, ?)
      `,
      [status_asal, status_tujuan, id_role, nama_aksi, is_active ?? 1]
    );

    res.status(201).json({
      message: "Workflow berhasil dibuat",
      data: {
        id_transisi: result.insertId,
        status_asal,
        status_tujuan,
        id_role,
        nama_aksi,
        is_active: is_active ?? 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal membuat workflow",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

const updateWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const { status_asal, status_tujuan, id_role, nama_aksi, is_active } =
      req.body;

    if (!status_asal || !status_tujuan || !id_role || !nama_aksi) {
      return res.status(400).json({
        message: "status_asal, status_tujuan, id_role, dan nama_aksi wajib diisi",
      });
    }

    const [result] = await db.query(
      `
      UPDATE workflow
      SET status_asal = ?,
          status_tujuan = ?,
          id_role = ?,
          nama_aksi = ?,
          is_active = ?
      WHERE id_transisi = ?
      `,
      [status_asal, status_tujuan, id_role, nama_aksi, is_active ?? 1, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Workflow tidak ditemukan",
      });
    }

    res.status(200).json({
      message: "Workflow berhasil diupdate",
      data: {
        id_transisi: Number(id),
        status_asal,
        status_tujuan,
        id_role,
        nama_aksi,
        is_active: is_active ?? 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengupdate workflow",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

const deleteWorkflow = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "DELETE FROM workflow WHERE id_transisi = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Workflow tidak ditemukan",
      });
    }

    res.status(200).json({
      message: "Workflow berhasil dihapus",
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal menghapus workflow",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

module.exports = {
  getAllWorkflow,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
};
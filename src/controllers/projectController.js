const db = require("../config/database");

const getAllProjects = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        p.id_project,
        p.nama_project,
        p.deskripsi,
        p.created_by,
        u.nama_user AS creator,
        p.created_at,
        p.updated_at
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id_user
      ORDER BY p.id_project DESC
    `);

    res.status(200).json({
      message: "Berhasil mengambil data projects",
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data projects",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `
      SELECT
        p.id_project,
        p.nama_project,
        p.deskripsi,
        p.created_by,
        u.nama_user AS creator,
        p.created_at,
        p.updated_at
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id_user
      WHERE p.id_project = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Project tidak ditemukan",
      });
    }

    res.status(200).json({
      message: "Berhasil mengambil detail project",
      data: rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil detail project",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

const createProject = async (req, res) => {
  try {
    const { nama_project, deskripsi, created_by } = req.body;

    if (!nama_project || !created_by) {
      return res.status(400).json({
        message: "nama_project dan created_by wajib diisi",
      });
    }

    const [result] = await db.query(
      "INSERT INTO projects (nama_project, deskripsi, created_by) VALUES (?, ?, ?)",
      [nama_project, deskripsi || null, created_by]
    );

    res.status(201).json({
      message: "Project berhasil dibuat",
      data: {
        id_project: result.insertId,
        nama_project,
        deskripsi: deskripsi || null,
        created_by,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal membuat project",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_project, deskripsi } = req.body;

    if (!nama_project) {
      return res.status(400).json({
        message: "nama_project wajib diisi",
      });
    }

    const [result] = await db.query(
      "UPDATE projects SET nama_project = ?, deskripsi = ? WHERE id_project = ?",
      [nama_project, deskripsi || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Project tidak ditemukan",
      });
    }

    res.status(200).json({
      message: "Project berhasil diupdate",
      data: {
        id_project: Number(id),
        nama_project,
        deskripsi: deskripsi || null,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengupdate project",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "DELETE FROM projects WHERE id_project = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Project tidak ditemukan",
      });
    }

    res.status(200).json({
      message: "Project berhasil dihapus",
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal menghapus project",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
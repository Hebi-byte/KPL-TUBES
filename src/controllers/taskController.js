const db = require("../config/database");

const getAllTasks = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        t.id_task,
        t.id_project,
        p.nama_project,
        t.judul_task,
        t.deskripsi_task,
        t.id_status,
        s.nama_status,
        t.created_by,
        creator.nama_user AS creator,
        t.assigned_to,
        assignee.nama_user AS assignee,
        t.due_date,
        t.created_at,
        t.updated_at
      FROM tasks t
      LEFT JOIN projects p ON t.id_project = p.id_project
      LEFT JOIN statuses s ON t.id_status = s.id_status
      LEFT JOIN users creator ON t.created_by = creator.id_user
      LEFT JOIN users assignee ON t.assigned_to = assignee.id_user
      ORDER BY t.id_task DESC
    `);

    res.status(200).json({
      message: "Berhasil mengambil data tasks",
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data tasks",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `
      SELECT
        t.id_task,
        t.id_project,
        p.nama_project,
        t.judul_task,
        t.deskripsi_task,
        t.id_status,
        s.nama_status,
        t.created_by,
        creator.nama_user AS creator,
        t.assigned_to,
        assignee.nama_user AS assignee,
        t.due_date,
        t.created_at,
        t.updated_at
      FROM tasks t
      LEFT JOIN projects p ON t.id_project = p.id_project
      LEFT JOIN statuses s ON t.id_status = s.id_status
      LEFT JOIN users creator ON t.created_by = creator.id_user
      LEFT JOIN users assignee ON t.assigned_to = assignee.id_user
      WHERE t.id_task = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Task tidak ditemukan",
      });
    }

    res.status(200).json({
      message: "Berhasil mengambil detail task",
      data: rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil detail task",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

const createTask = async (req, res) => {
  try {
    const {
      id_project,
      judul_task,
      deskripsi_task,
      id_status,
      created_by,
      assigned_to,
      due_date,
    } = req.body;

    if (!id_project || !judul_task || !id_status || !created_by) {
      return res.status(400).json({
        message: "id_project, judul_task, id_status, dan created_by wajib diisi",
      });
    }
    
  // CEK STATUS TASK SAAT INI
  const [currentTask] = await db.query(
    `
    SELECT id_status
    FROM tasks
    WHERE id_task = ?
    `,
    [id]
  );

  if (currentTask.length === 0) {
    return res.status(404).json({
      message: "Task tidak ditemukan",
    });
  }

  const currentStatus = currentTask[0].id_status;

  // VALIDASI WORKFLOW
  const [workflow] = await db.query(
    `
    SELECT *
    FROM workflow
    WHERE route_name = ?
    AND status_asal = ?
    AND status_tujuan = ?
    AND id_role = ?
    AND is_active = 1
    `,
    [
      "task.update",
      currentStatus,
      id_status,
      id_role,
    ]
  );

if (workflow.length === 0) {
  return res.status(403).json({
    message: "Perpindahan status tidak diizinkan",
  });
}

    const [result] = await db.query(
      `
      INSERT INTO tasks
      (id_project, judul_task, deskripsi_task, id_status, created_by, assigned_to, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id_project,
        judul_task,
        deskripsi_task || null,
        id_status,
        created_by,
        assigned_to || null,
        due_date || null,
      ]
    );

    res.status(201).json({
      message: "Task berhasil dibuat",
      data: {
        id_task: result.insertId,
        id_project,
        judul_task,
        deskripsi_task: deskripsi_task || null,
        id_status,
        created_by,
        assigned_to: assigned_to || null,
        due_date: due_date || null,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal membuat task",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      id_project,
      judul_task,
      deskripsi_task,
      id_status,
      assigned_to,
      due_date,
      id_role,
    } = req.body;

    if (!id_project || !judul_task || !id_status) {
      return res.status(400).json({
        message: "id_project, judul_task, dan id_status wajib diisi",
      });
    }

    const [result] = await db.query(
      `
      UPDATE tasks
      SET id_project = ?,
          judul_task = ?,
          deskripsi_task = ?,
          id_status = ?,
          assigned_to = ?,
          due_date = ?
      WHERE id_task = ?
      `,
      [
        id_project,
        judul_task,
        deskripsi_task || null,
        id_status,
        assigned_to || null,
        due_date || null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Task tidak ditemukan",
      });
    }

    res.status(200).json({
      message: "Task berhasil diupdate",
      data: {
        id_task: Number(id),
        id_project,
        judul_task,
        deskripsi_task: deskripsi_task || null,
        id_status,
        assigned_to: assigned_to || null,
        due_date: due_date || null,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengupdate task",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "DELETE FROM tasks WHERE id_task = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Task tidak ditemukan",
      });
    }

    res.status(200).json({
      message: "Task berhasil dihapus",
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal menghapus task",
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
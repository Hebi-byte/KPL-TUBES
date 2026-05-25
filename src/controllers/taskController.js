const db = require("../config/database");

function normalizeDateTime(value) {
  const clean = String(value || "").trim();

  if (!clean) {
    return null;
  }

  // Input dari <input type="datetime-local"> biasanya: YYYY-MM-DDTHH:mm
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(clean)) {
    return `${clean.replace("T", " ")}:00`;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(clean)) {
    return clean.replace("T", " ");
  }

  return clean.replace("T", " ");
}


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
      return res.status(404).json({ message: "Task tidak ditemukan" });
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
      created_by,
      due_date,
      waktu_task,
    } = req.body;

    const cleanTitle = String(judul_task || "").trim();
    const projectId = Number(id_project);

    // Pembuat task diambil dari user login yang dikirim frontend.
    // assigned_to otomatis disamakan dengan created_by.
    const creatorId = Number(
      req.user?.id_user ||
      req.user?.id ||
      created_by ||
      req.body.id_user ||
      req.body.user_id
    );

    if (!projectId || !cleanTitle || !creatorId) {
      return res.status(400).json({
        message: "id_project, judul_task, dan created_by wajib diisi",
      });
    }

    const [pendingRows] = await db.query(
      `
      SELECT id_status, nama_status
      FROM statuses
      WHERE LOWER(TRIM(nama_status)) = 'pending'
         OR LOWER(TRIM(nama_status)) LIKE '%pending%'
      ORDER BY id_status ASC
      LIMIT 1
      `
    );

    if (pendingRows.length === 0) {
      return res.status(400).json({
        message: "Status pending belum ada di tabel statuses",
      });
    }

    const pendingStatus = pendingRows[0];
    const assignedTo = creatorId;
    const taskDate = normalizeDateTime(due_date || waktu_task);

    const [result] = await db.query(
      `
      INSERT INTO tasks
        (id_project, judul_task, deskripsi_task, id_status, created_by, assigned_to, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        projectId,
        cleanTitle,
        deskripsi_task || null,
        pendingStatus.id_status,
        creatorId,
        assignedTo,
        taskDate,
      ]
    );

    res.status(201).json({
      message: "Task berhasil dibuat",
      data: {
        id_task: result.insertId,
        id_project: projectId,
        judul_task: cleanTitle,
        deskripsi_task: deskripsi_task || null,
        id_status: pendingStatus.id_status,
        nama_status: pendingStatus.nama_status,
        created_by: creatorId,
        assigned_to: assignedTo,
        due_date: taskDate,
        waktu_task: taskDate,
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
    const { judul_task, deskripsi_task, id_status } = req.body;

    const taskId = Number(id);
    const cleanTitle = String(judul_task || "").trim();
    const statusId = Number(id_status);

    // User yang sedang login / sedang edit task.
    // Kalau backend punya middleware auth, ambil dari req.user.
    // Kalau belum, frontend mengirim updated_by dari localStorage user login.
    const editorId = Number(
      req.user?.id_user ||
      req.user?.id ||
      req.body.updated_by ||
      req.body.edited_by ||
      req.body.id_user ||
      req.body.user_id
    );

    if (!taskId || !cleanTitle || !statusId || !editorId) {
      return res.status(400).json({
        message: "Nama task, status, dan user login wajib tersedia",
      });
    }

    // Pastikan task-nya ada dulu.
    const [taskRows] = await db.query(
      "SELECT id_task FROM tasks WHERE id_task = ? LIMIT 1",
      [taskId]
    );

    if (taskRows.length === 0) {
      return res.status(404).json({ message: "Task tidak ditemukan" });
    }

    // Pastikan status yang dipilih memang ada di tabel statuses.
    const [statusRows] = await db.query(
      "SELECT id_status, nama_status FROM statuses WHERE id_status = ? LIMIT 1",
      [statusId]
    );

    if (statusRows.length === 0) {
      return res.status(400).json({ message: "Status yang dipilih tidak ditemukan" });
    }

    // Pastikan user yang mengedit memang ada.
    const [editorRows] = await db.query(
      "SELECT id_user, nama_user FROM users WHERE id_user = ? LIMIT 1",
      [editorId]
    );

    if (editorRows.length === 0) {
      return res.status(400).json({ message: "User editor tidak ditemukan" });
    }

    // Field yang diinput user tetap cuma nama, deskripsi, dan status.
    // assigned_to otomatis pindah ke akun yang sedang mengedit task.
    await db.query(
      `
      UPDATE tasks
      SET judul_task = ?,
          deskripsi_task = ?,
          id_status = ?,
          assigned_to = ?
      WHERE id_task = ?
      `,
      [cleanTitle, deskripsi_task || null, statusId, editorId, taskId]
    );

    res.status(200).json({
      message: "Task berhasil diupdate",
      data: {
        id_task: taskId,
        judul_task: cleanTitle,
        deskripsi_task: deskripsi_task || null,
        id_status: statusRows[0].id_status,
        nama_status: statusRows[0].nama_status,
        assigned_to: editorRows[0].id_user,
        assignee: editorRows[0].nama_user,
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

    const [result] = await db.query("DELETE FROM tasks WHERE id_task = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Task tidak ditemukan" });
    }

    res.status(200).json({ message: "Task berhasil dihapus" });
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

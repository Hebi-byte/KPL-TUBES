const db = require("../config/database");
const jwt = require("jsonwebtoken");

const ROLE_BY_ID = {
  1: "owner",
  2: "read",
  3: "edit",
};

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

function normalizeRoleName(value) {
  return String(value || "").trim().toLowerCase();
}

function getRoleName(user) {
  return normalizeRoleName(user?.nama_role) || ROLE_BY_ID[Number(user?.id_role)] || "";
}

function hasAnyRole(user, allowedRoles = []) {
  const roleName = getRoleName(user);
  return allowedRoles.includes(roleName);
}

function getUserIdFromToken(req) {
  const authHeader = req.headers?.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) return 0;

  try {
    const decoded = process.env.JWT_SECRET
      ? jwt.verify(token, process.env.JWT_SECRET)
      : jwt.decode(token);

    return Number(decoded?.id_user || decoded?.id || decoded?.user_id || 0);
  } catch (error) {
    return 0;
  }
}

function getActorId(req) {
  return Number(
    req.user?.id_user ||
      req.user?.id ||
      getUserIdFromToken(req) ||
      req.body?.created_by ||
      req.body?.updated_by ||
      req.body?.deleted_by ||
      req.body?.id_user ||
      req.body?.user_id ||
      0
  );
}

async function getActor(req) {
  const actorId = getActorId(req);

  if (!actorId) return null;

  const [rows] = await db.query(
    `
    SELECT u.id_user, u.nama_user, u.email, u.id_role, r.nama_role
    FROM users u
    LEFT JOIN roles r ON u.id_role = r.id_role
    WHERE u.id_user = ?
    LIMIT 1
    `,
    [actorId]
  );

  return rows[0] || null;
}

function forbidden(res, message) {
  return res.status(403).json({ message });
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
    const { id_project, judul_task, deskripsi_task, due_date, waktu_task } = req.body;

    const cleanTitle = String(judul_task || "").trim();
    const projectId = Number(id_project);
    const actor = await getActor(req);

    if (!actor) {
      return res.status(401).json({ message: "User login tidak ditemukan" });
    }

    if (!hasAnyRole(actor, ["owner", "edit"])) {
      return forbidden(res, "Role kamu hanya bisa melihat, tidak boleh menambah task");
    }

    const taskDate = normalizeDateTime(due_date || waktu_task);

    if (!projectId || !cleanTitle || !taskDate) {
      return res.status(400).json({
        message: "id_project, judul_task, dan due_date wajib diisi",
      });
    }

    const [projectRows] = await db.query(
      "SELECT id_project FROM projects WHERE id_project = ? LIMIT 1",
      [projectId]
    );

    if (projectRows.length === 0) {
      return res.status(404).json({ message: "Project tidak ditemukan" });
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

    // Pembuat dan assignee otomatis dari akun yang sedang login.
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
        actor.id_user,
        actor.id_user,
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
        created_by: actor.id_user,
        assigned_to: actor.id_user,
        assignee: actor.nama_user,
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
    const { judul_task, deskripsi_task, due_date, id_status } = req.body;

    const taskId = Number(id);
    const cleanTitle = String(judul_task || "").trim();
    const taskDate = normalizeDateTime(due_date);
    const statusId = Number(id_status);
    const actor = await getActor(req);

    if (!actor) {
      return res.status(401).json({ message: "User login tidak ditemukan" });
    }

    if (!hasAnyRole(actor, ["owner", "edit"])) {
      return forbidden(res, "Role kamu hanya bisa melihat, tidak boleh mengedit task");
    }

    if (!taskId || !cleanTitle || !taskDate || !statusId) {
      return res.status(400).json({
        message: "Nama task, due date, dan status wajib tersedia",
      });
    }

    const [taskRows] = await db.query(
      "SELECT id_task FROM tasks WHERE id_task = ? LIMIT 1",
      [taskId]
    );

    if (taskRows.length === 0) {
      return res.status(404).json({ message: "Task tidak ditemukan" });
    }

    const [statusRows] = await db.query(
      "SELECT id_status, nama_status FROM statuses WHERE id_status = ? LIMIT 1",
      [statusId]
    );

    if (statusRows.length === 0) {
      return res.status(400).json({ message: "Status yang dipilih tidak ditemukan" });
    }

    // assigned_to otomatis pindah ke akun yang sedang mengedit task.
    // updated_at otomatis berubah karena kolom database menggunakan ON UPDATE CURRENT_TIMESTAMP.
    await db.query(
      `
      UPDATE tasks
      SET judul_task = ?,
          deskripsi_task = ?,
          due_date = ?,
          id_status = ?,
          assigned_to = ?
      WHERE id_task = ?
      `,
      [cleanTitle, deskripsi_task || null, taskDate, statusId, actor.id_user, taskId]
    );

    res.status(200).json({
      message: "Task berhasil diupdate",
      data: {
        id_task: taskId,
        judul_task: cleanTitle,
        deskripsi_task: deskripsi_task || null,
        due_date: taskDate,
        id_status: statusRows[0].id_status,
        nama_status: statusRows[0].nama_status,
        assigned_to: actor.id_user,
        assignee: actor.nama_user,
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
    const actor = await getActor(req);

    if (!actor) {
      return res.status(401).json({ message: "User login tidak ditemukan" });
    }

    if (!hasAnyRole(actor, ["owner"])) {
      return forbidden(res, "Role kamu tidak boleh menghapus task");
    }

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

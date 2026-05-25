const db = require("../config/database");
const jwt = require("jsonwebtoken");

const ROLE_BY_ID = {
  1: "owner",
  2: "read",
  3: "edit",
};

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
      return res.status(404).json({ message: "Project tidak ditemukan" });
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
    const { nama_project, deskripsi } = req.body;
    const cleanName = String(nama_project || "").trim();
    const actor = await getActor(req);

    if (!actor) {
      return res.status(401).json({ message: "User login tidak ditemukan" });
    }

    if (!hasAnyRole(actor, ["owner"])) {
      return forbidden(res, "Role kamu tidak boleh menambah project");
    }

    if (!cleanName) {
      return res.status(400).json({ message: "nama_project wajib diisi" });
    }

    const [result] = await db.query(
      "INSERT INTO projects (nama_project, deskripsi, created_by) VALUES (?, ?, ?)",
      [cleanName, deskripsi || null, actor.id_user]
    );

    res.status(201).json({
      message: "Project berhasil dibuat",
      data: {
        id_project: result.insertId,
        nama_project: cleanName,
        deskripsi: deskripsi || null,
        created_by: actor.id_user,
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
    const cleanName = String(nama_project || "").trim();
    const actor = await getActor(req);

    if (!actor) {
      return res.status(401).json({ message: "User login tidak ditemukan" });
    }

    if (!hasAnyRole(actor, ["owner"])) {
      return forbidden(res, "Role kamu tidak boleh mengedit project");
    }

    if (!cleanName) {
      return res.status(400).json({ message: "nama_project wajib diisi" });
    }

    const [result] = await db.query(
      "UPDATE projects SET nama_project = ?, deskripsi = ? WHERE id_project = ?",
      [cleanName, deskripsi || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Project tidak ditemukan" });
    }

    res.status(200).json({
      message: "Project berhasil diupdate",
      data: {
        id_project: Number(id),
        nama_project: cleanName,
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
    const actor = await getActor(req);

    if (!actor) {
      return res.status(401).json({ message: "User login tidak ditemukan" });
    }

    if (!hasAnyRole(actor, ["owner"])) {
      return forbidden(res, "Role kamu tidak boleh menghapus project");
    }

    const [result] = await db.query("DELETE FROM projects WHERE id_project = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Project tidak ditemukan" });
    }

    res.status(200).json({ message: "Project berhasil dihapus" });
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

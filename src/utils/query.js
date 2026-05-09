
const db = require("../config/database");

// Ambil semua data dari tabel tertentu
const getAll = async (tableName) => {
  const [rows] = await db.execute(`SELECT * FROM ${tableName}`);
  return rows;
};

// Ambil satu data berdasarkan ID
const getById = async (tableName, pkColumn, id) => {
  const params = [id];
  const [rows] = await db.execute(
    `SELECT * FROM ${tableName} WHERE ${pkColumn} = ?`,
    params
  );
  return rows[0] || null;
};

// Tambah data baru
const create = async (tableName, data) => {
  const kolom = Object.keys(data).join(", ");
  const tanda = Object.keys(data).map(() => "?").join(", ");
  
  const params = Object.values(data);

  const [result] = await db.execute(
    `INSERT INTO ${tableName} (${kolom}) VALUES (${tanda})`,
    params
  );
  return result.insertId;
};

// Update data
const update = async (tableName, pkColumn, id, data) => {
  const set = Object.keys(data).map((k) => `${k} = ?`).join(", ");
  
  const params = [...Object.values(data), id];

  const [result] = await db.execute(
    `UPDATE ${tableName} SET ${set} WHERE ${pkColumn} = ?`,
    params
  );
  return result.affectedRows > 0;
};

// Hapus data
const remove = async (tableName, pkColumn, id) => {
  const params = [id];
  const [result] = await db.execute(
    `DELETE FROM ${tableName} WHERE ${pkColumn} = ?`,
    params
  );
  return result.affectedRows > 0;
};

module.exports = { getAll, getById, create, update, remove };
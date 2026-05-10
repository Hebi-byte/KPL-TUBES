const getAllCommits = async (req, res) => {
  res.status(200).json({
    message: "Fitur commit belum tersedia karena tabel commits tidak ada di database",
    data: [],
  });
};

const getCommitById = async (req, res) => {
  res.status(404).json({
    message: "Fitur commit belum tersedia karena tabel commits tidak ada di database",
  });
};

const createCommit = async (req, res) => {
  res.status(501).json({
    message: "Fitur commit belum diimplementasikan karena tabel commits tidak ada di database",
  });
};

module.exports = {
  getAllCommits,
  getCommitById,
  createCommit,
};
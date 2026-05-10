const express = require("express");
const router = express.Router();

const {
  getAllCommits,
  getCommitById,
  createCommit,
} = require("../controllers/commitController");

router.get("/", getAllCommits);
router.get("/:id", getCommitById);
router.post("/", createCommit);

module.exports = router;
const express = require("express");
const router = express.Router();

const {
  getAllTaskHistory,
  getTaskHistoryById,
  createTaskHistory,
  updateTaskHistory,
  deleteTaskHistory,
} = require("../controllers/taskHistoryController");

router.get("/", getAllTaskHistory);
router.get("/:id", getTaskHistoryById);
router.post("/", createTaskHistory);
router.put("/:id", updateTaskHistory);
router.delete("/:id", deleteTaskHistory);

module.exports = router;
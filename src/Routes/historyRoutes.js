const express = require("express");
const router = express.Router();

const {
  getAllHistory,
  getHistoryById,
  createHistory,
} = require("../controllers/historyController");

router.get("/", getAllHistory);
router.get("/:id", getHistoryById);
router.post("/", createHistory);

module.exports = router;
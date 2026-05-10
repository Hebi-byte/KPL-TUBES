const express = require("express");
const router = express.Router();

const {
  getAllStatuses,
  getStatusById,
  createStatus,
  updateStatus,
  deleteStatus,
} = require("../controllers/statusController");

router.get("/", getAllStatuses);
router.get("/:id", getStatusById);
router.post("/", createStatus);
router.put("/:id", updateStatus);
router.delete("/:id", deleteStatus);

module.exports = router;
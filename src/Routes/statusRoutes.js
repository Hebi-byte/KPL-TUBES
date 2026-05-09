const express = require("express");
const router = express.Router();

const {
  getAllStatuses,
  getStatusById,
} = require("../controllers/statusController");

router.get("/", getAllStatuses);
router.get("/:id", getStatusById);
router.post("/", createStatus);

module.exports = router;
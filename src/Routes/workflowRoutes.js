const express = require("express");
const router = express.Router();

const {
  getAllWorkflow,
  getWorkflowById,
} = require("../controllers/workflowController");

router.get("/", getAllWorkflow);
router.get("/:id", getWorkflowById);
router.post("/", createWorkflow);

module.exports = router;
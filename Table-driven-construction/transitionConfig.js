// daftar status
const statuses = [
  { id: 1, name: "TODO" },
  { id: 2, name: "IN_PROGRESS" },
  { id: 3, name: "REVIEW" },
  { id: 4, name: "DONE" },
];


// aturan perpindahan status
const statusTransitions = [
  {
    id: 1,
    from_status_id: 1,
    to_status_id: 2,
    allowed_role: "programmer",
  },

  {
    id: 2,
    from_status_id: 2,
    to_status_id: 3,
    allowed_role: "programmer",
  },

  {
    id: 3,
    from_status_id: 3,
    to_status_id: 4,
    allowed_role: "reviewer",
  },

  {
    id: 4,
    from_status_id: 4,
    to_status_id: 1,
    allowed_role: "admin",
  },
];


// export config
module.exports = {
  statuses,
  statusTransitions,
};
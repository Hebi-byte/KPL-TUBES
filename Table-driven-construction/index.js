const { canTransition } = require("./taskFlowService");


// data task
const task = {
  id: 1,
  title: "Membuat Login",
  status_id: 1,
};


// data user
const user = {
  id: 1,
  role: "programmer",
};


// status tujuan
const nextStatusId = 2;


// panggil function validator
const isAllowed = canTransition(
  task.status_id,
  nextStatusId,
  user.role
);


// cek hasil validasi
if (isAllowed) {

  // update status
  task.status_id = nextStatusId;

  console.log("Status berhasil diubah");

} else {

  console.log("Transisi tidak diizinkan");

}
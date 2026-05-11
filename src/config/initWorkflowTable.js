const db = require("./database");

const createWorkflowTable = async () => {
  try {
    
    // CREATE TABLE
    await db.query(`
      CREATE TABLE IF NOT EXISTS workflow (
          id_workflow INT AUTO_INCREMENT PRIMARY KEY,

          route_name VARCHAR(100) NOT NULL,

          status_asal INT NOT NULL,
          status_tujuan INT NOT NULL,

          id_role INT NOT NULL,

          nama_aksi VARCHAR(100) NOT NULL,

          is_active BOOLEAN DEFAULT TRUE,

          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

          FOREIGN KEY (status_asal) REFERENCES statuses(id_status),
          FOREIGN KEY (status_tujuan) REFERENCES statuses(id_status)
      )
    `);

    console.log("Table workflow berhasil dibuat");

    // INSERT DATA DEFAULT
    await db.query(`
      INSERT INTO workflow
      (route_name, status_asal, status_tujuan, id_role, nama_aksi)

      VALUES

      ('task.update', 1, 2, 1, 'Mulai Task'),
      ('task.update', 2, 3, 2, 'Review Task'),
      ('task.update', 3, 4, 3, 'Selesaikan Task')

    `);

    console.log("Data workflow berhasil ditambahkan");

  } catch (error) {
    console.log("Error workflow:", error.message);
  }
};

createWorkflowTable();
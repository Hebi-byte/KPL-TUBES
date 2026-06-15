const fs = require('fs');
const path = require('path');

const logger = (req, res, next) => {
    const now = new Date();
    // Format log: [YYYY-MM-DDTHH:mm:ss.sssZ] GET /api/users
    const logMessage = `[${now.toISOString()}] ${req.method} ${req.originalUrl}\n`;

    // 1. Munculkan di terminal (opsional, biar kelihatan keren pas di-run)
    console.log(`📡 Request: ${req.method} ${req.originalUrl}`);

    // 2. Simpan ke file
    const logDir = path.join(__dirname, '../logs');
    
    // Buat folder 'logs' kalau belum ada
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }

    // Tulis ke dalam app.log
    fs.appendFile(path.join(logDir, 'app.log'), logMessage, (err) => {
        if (err) console.error('Gagal menulis log:', err);
    });

    next(); // Lanjut ke middleware/controller berikutnya
};

module.exports = logger;
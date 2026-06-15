const errorHandler = (err, req, res, next) => {
    // Catat error di terminal (berguna buat debugging tim)
    console.error(`[ERROR]: ${err.message}`);
    
    // Set status code (default 500 kalau tidak ada)
    const statusCode = err.statusCode || 500;

    // Kirim response error yang rapi
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Terjadi kesalahan internal pada server',
        // Stack trace hanya dimunculkan kalau bukan di mode production
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};

module.exports = errorHandler;
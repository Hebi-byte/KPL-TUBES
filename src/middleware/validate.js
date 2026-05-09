// Tujuan: Middleware validasi yang DIPARAMETERISASI
// dengan daftar field yang wajib diisi.
// Jadi tidak perlu buat middleware validasi baru
// untuk setiap route.

// CONTOH PEMAKAIAN:
//   router.post("/users",    validate(["name", "email", "password"]), ...);
//   router.post("/products", validate(["name", "price"]), ...);

const validate = (requiredFields) => {
  return (req, res, next) => {
    const errors = [];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        errors.push(`${field} wajib diisi`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validasi gagal",
        errors: errors,
      });
    }

    next();
  };
};

module.exports = { validate };

const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({
        message: "Token tidak ditemukan. Silakan login ulang.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id_user: decoded.id_user,
      email: decoded.email,
      id_role: decoded.id_role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token tidak valid atau sudah expired. Silakan login ulang.",
    });
  }
};

module.exports = { authMiddleware };

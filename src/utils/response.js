// ============================================
// PARAMETERIZATION / GENERICS
// File: src/utils/response.js
//
// Tujuan: Daripada nulis res.json() berulang-ulang
// di setiap controller, cukup panggil fungsi ini.
// "data", "message", dan "statusCode" adalah PARAMETER-nya.
// ============================================

const sendSuccess = (res, data, message = "Berhasil", statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message: message,
    data: data,
  });
};

const sendError = (res, message = "Terjadi kesalahan", statusCode = 500) => {
  res.status(statusCode).json({
    success: false,
    message: message,
  });
};

module.exports = { sendSuccess, sendError };

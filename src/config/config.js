require("dotenv").config();

const port = Number(process.env.PORT) || 8080;

module.exports = {
  port,
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/entregafinal_be2",
  jwtSecret: process.env.JWT_SECRET || "coder_secret_2024",
  baseUrl: process.env.BASE_URL || `http://localhost:${port}`,
  resetTokenTtlMs: 60 * 60 * 1000, // el enlace de recuperacion expira a la hora
  mail: {
    service: process.env.MAIL_SERVICE || "gmail",
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
    from: process.env.MAIL_FROM || process.env.MAIL_USER
  },
  admin: {
    email: process.env.ADMIN_EMAIL || "admin@coder.com",
    password: process.env.ADMIN_PASSWORD || "admin1234"
  }
};

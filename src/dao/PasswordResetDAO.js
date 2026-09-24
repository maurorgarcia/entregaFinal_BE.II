const PasswordReset = require("../models/PasswordReset");

class PasswordResetDAO {
  // Un usuario tiene un solo enlace vigente: al pedir otro se invalida el anterior
  async replaceForUser(userId, tokenHash, expiresAt) {
    await PasswordReset.deleteMany({ user: userId });
    return PasswordReset.create({ user: userId, tokenHash, expiresAt });
  }

  findByTokenHash(tokenHash) {
    return PasswordReset.findOne({ tokenHash }).lean();
  }

  deleteByUser(userId) {
    return PasswordReset.deleteMany({ user: userId });
  }
}

module.exports = PasswordResetDAO;

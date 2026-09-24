const PasswordResetDAO = require("../dao/PasswordResetDAO");

class PasswordResetRepository {
  constructor(dao = new PasswordResetDAO()) {
    this.dao = dao;
  }

  saveToken(userId, tokenHash, expiresAt) {
    return this.dao.replaceForUser(userId, tokenHash, expiresAt);
  }

  getByTokenHash(tokenHash) {
    return this.dao.findByTokenHash(tokenHash);
  }

  clearForUser(userId) {
    return this.dao.deleteByUser(userId);
  }
}

module.exports = PasswordResetRepository;

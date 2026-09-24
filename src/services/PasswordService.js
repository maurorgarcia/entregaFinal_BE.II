const crypto = require("crypto");
const bcrypt = require("bcrypt");
const config = require("../config/config");
const mailService = require("./MailService");
const { userRepository, passwordResetRepository } = require("../repositories");
const { HttpError } = require("../utils/errors");

const hashToken = token => crypto.createHash("sha256").update(token).digest("hex");

class PasswordService {
  constructor(users = userRepository, resets = passwordResetRepository, mailer = mailService) {
    this.users = users;
    this.resets = resets;
    this.mailer = mailer;
  }

  // No revela si el email existe: el router siempre responde igual
  async requestReset(email) {
    const user = email ? await this.users.getUserByEmail(email) : null;
    if (!user) return;

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + config.resetTokenTtlMs);
    await this.resets.saveToken(user._id, hashToken(token), expiresAt);

    const link = `${config.baseUrl}/reset-password?token=${token}`;
    await this.mailer.sendPasswordReset(user.email, user.first_name, link);
  }

  async resetPassword(token, newPassword) {
    if (!token || !newPassword) throw new HttpError(400, "Token y nueva contraseña son obligatorios");

    const invalidLink = new HttpError(400, "El enlace es invalido o expiro. Solicita uno nuevo");

    const reset = await this.resets.getByTokenHash(hashToken(String(token)));
    if (!reset || reset.expiresAt < new Date()) throw invalidLink;

    const user = await this.users.getUserById(reset.user, { withPassword: true });
    if (!user) throw invalidLink;

    if (bcrypt.compareSync(newPassword, user.password)) {
      throw new HttpError(400, "La nueva contraseña no puede ser igual a la anterior");
    }

    await this.users.updateUser(user._id, { password: bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10)) });
    await this.resets.clearForUser(user._id);
  }
}

module.exports = PasswordService;

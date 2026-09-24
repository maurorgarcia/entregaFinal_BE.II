const mongoose = require("mongoose");

const passwordResetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Se guarda el hash del token: si la base se filtra, los enlaces no sirven
    tokenHash: { type: String, required: true, unique: true },
    // MongoDB borra el documento automaticamente al vencer
    expiresAt: { type: Date, required: true, index: { expires: 0 } }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("PasswordReset", passwordResetSchema);

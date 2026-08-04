const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true,
      trim: true
    },
    last_name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    age: {
      type: Number,
      required: true
    },
    password: {
      type: String,
      required: true,
      select: false // No devolver el password en queries por defecto
    },
    cart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart"
    },
    role: {
      type: String,
      default: "user"
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Método para verificar la contraseña
userSchema.methods.isValidPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model("User", userSchema);

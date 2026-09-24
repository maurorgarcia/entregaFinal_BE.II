const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const UserDTO = require("../dto/UserDTO");
const { authenticate } = require("../middleware/auth.middleware");
const { passwordService } = require("../services");
const { sendError } = require("../utils/errors");

const router = express.Router();

// REGISTER
router.post("/register", (req, res, next) => {
  passport.authenticate("register", { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({ status: "error", message: "Error interno del servidor" });
    }
    if (!user) {
      return res.status(400).json({ status: "error", message: (info && info.message) || "Error al registrar" });
    }
    // Usuario creado correctamente - quitamos el password del payload de respuesta
    const userResponse = user.toObject ? user.toObject() : { ...user };
    delete userResponse.password;
    res.status(201).json({ status: "success", message: "Usuario registrado con éxito", payload: userResponse });
  })(req, res, next);
});

// LOGIN
router.post("/login", (req, res, next) => {
  passport.authenticate("login", { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({ status: "error", message: "Error interno del servidor" });
    }
    if (!user) {
      return res.status(401).json({ status: "error", message: (info && info.message) || "Credenciales inválidas" });
    }

    // Generar Token JWT
    const token = jwt.sign({ _id: user._id, email: user.email, role: user.role }, config.jwtSecret, { expiresIn: "1h" });

    // Se puede enviar en una cookie y en el body
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: 3600000 // 1 hora
    });

    res.json({
      status: "success",
      message: "Login exitoso",
      token: token
    });
  })(req, res, next);
});

router.get("/current", authenticate("current"), (req, res) => {
  res.json({
    status: "success",
    payload: new UserDTO(req.user)
  });
});

router.post("/forgot-password", async (req, res) => {
  try {
    await passwordService.requestReset(req.body.email);
    // Respuesta identica exista o no el email, para no filtrar que cuentas estan registradas
    res.json({
      status: "success",
      message: "Si el email esta registrado, te enviamos un correo para restablecer la contraseña"
    });
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    await passwordService.resetPassword(token, password);
    res.json({ status: "success", message: "Contraseña actualizada correctamente" });
  } catch (error) {
    sendError(res, error);
  }
});

// LOGOUT
router.get("/logout", (req, res) => {
  res.clearCookie("jwt");
  res.json({ status: "success", message: "Logout exitoso" });
});

module.exports = router;

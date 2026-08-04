const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "coder_secret_2024";

// REGISTER
router.post("/register", (req, res, next) => {
  passport.authenticate("register", { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({ status: "error", message: "Error interno del servidor" });
    }
    if (!user) {
      return res.status(400).json({ status: "error", message: info.message || "Error al registrar" });
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
      return res.status(401).json({ status: "error", message: info.message || "Credenciales inválidas" });
    }

    // Generar Token JWT
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "1h" });

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

// CURRENT (Devuelve el usuario logueado según el JWT)
router.get("/current", authenticate("jwt"), (req, res) => {
  // authenticate("jwt") ya validó el token y puso el payload en req.user
  res.json({
    status: "success",
    payload: req.user
  });
});

// LOGOUT
router.get("/logout", (req, res) => {
  res.clearCookie("jwt");
  res.json({ status: "success", message: "Logout exitoso" });
});

module.exports = router;

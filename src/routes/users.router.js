const express = require("express");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const UserManager = require("../managers/UserManager");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = express.Router();
const userManager = new UserManager();

const isOwnerOrAdmin = (req, id) =>
  req.user.role === "admin" || String(req.user._id) === String(id);

const validateId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ status: "error", message: "ID de usuario invalido" });
  }
  next();
};

// GET todos los usuarios (solo admin)
router.get("/", authenticate("jwt"), authorize("admin"), async (req, res) => {
  try {
    const users = await userManager.getUsers();
    res.json({ status: "success", payload: users });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// GET un usuario (el propio usuario o admin)
router.get("/:id", authenticate("jwt"), validateId, async (req, res) => {
  try {
    if (!isOwnerOrAdmin(req, req.params.id)) {
      return res.status(403).json({ status: "error", message: "No tenes permisos para ver este usuario" });
    }
    const user = await userManager.getUserById(req.params.id);
    if (!user) return res.status(404).json({ status: "error", message: "Usuario no encontrado" });
    res.json({ status: "success", payload: user });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// PUT actualizar usuario (el propio usuario o admin)
router.put("/:id", authenticate("jwt"), validateId, async (req, res) => {
  try {
    if (!isOwnerOrAdmin(req, req.params.id)) {
      return res.status(403).json({ status: "error", message: "No tenes permisos para modificar este usuario" });
    }

    const { first_name, last_name, email, age, password, role } = req.body;
    const updateData = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (email !== undefined) updateData.email = email;
    if (age !== undefined) updateData.age = age;
    if (password) updateData.password = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    // Solo un admin puede cambiar roles
    if (role !== undefined) {
      if (req.user.role !== "admin") {
        return res.status(403).json({ status: "error", message: "Solo un admin puede cambiar el rol" });
      }
      updateData.role = role;
    }

    const updated = await userManager.updateUser(req.params.id, updateData);
    if (!updated) return res.status(404).json({ status: "error", message: "Usuario no encontrado" });
    res.json({ status: "success", payload: updated });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
});

// DELETE eliminar usuario (el propio usuario o admin)
router.delete("/:id", authenticate("jwt"), validateId, async (req, res) => {
  try {
    if (!isOwnerOrAdmin(req, req.params.id)) {
      return res.status(403).json({ status: "error", message: "No tenes permisos para eliminar este usuario" });
    }
    const deleted = await userManager.deleteUser(req.params.id);
    if (!deleted) return res.status(404).json({ status: "error", message: "Usuario no encontrado" });
    res.json({ status: "success", message: "Usuario eliminado" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = router;

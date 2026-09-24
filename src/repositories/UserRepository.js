const mongoose = require("mongoose");
const UserDAO = require("../dao/UserDAO");

// Repository: expone operaciones de dominio sobre usuarios y oculta el DAO a la logica de negocio
class UserRepository {
  constructor(dao = new UserDAO()) {
    this.dao = dao;
  }

  isValidId(id) {
    return mongoose.isValidObjectId(id);
  }

  createUser(data) {
    return this.dao.create(data);
  }

  getUsers() {
    return this.dao.findAll();
  }

  async getUserById(id, options) {
    if (!this.isValidId(id)) return null;
    return this.dao.findById(id, options);
  }

  getUserByEmail(email, options) {
    return this.dao.findByEmail(email, options);
  }

  updateUser(id, data) {
    return this.dao.update(id, data);
  }

  deleteUser(id) {
    return this.dao.delete(id);
  }
}

module.exports = UserRepository;

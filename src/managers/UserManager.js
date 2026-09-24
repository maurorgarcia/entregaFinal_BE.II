const User = require("../models/User");

class UserManager {
  async createUser(userData) {
    try {
      const newUser = new User(userData);
      await newUser.save();
      return newUser;
    } catch (error) {
      throw new Error(`Error al crear usuario: ${error.message}`);
    }
  }

  async getUserByEmail(email) {
    try {
      // Usamos +password para traer el password y poder validar en passport
      const user = await User.findOne({ email }).select("+password").populate("cart");
      return user;
    } catch (error) {
      throw new Error(`Error al buscar usuario por email: ${error.message}`);
    }
  }

  async getUsers() {
    try {
      return await User.find().populate("cart");
    } catch (error) {
      throw new Error(`Error al obtener usuarios: ${error.message}`);
    }
  }

  async getUserById(id) {
    try {
      const user = await User.findById(id).populate("cart");
      return user;
    } catch (error) {
      throw new Error(`Error al buscar usuario por id: ${error.message}`);
    }
  }

  async updateUser(id, updateData) {
    try {
      const updatedUser = await User.findByIdAndUpdate(id, updateData, { returnDocument: "after", runValidators: true });
      return updatedUser;
    } catch (error) {
      throw new Error(`Error al actualizar usuario: ${error.message}`);
    }
  }

  async deleteUser(id) {
    try {
      const deletedUser = await User.findByIdAndDelete(id);
      return deletedUser;
    } catch (error) {
      throw new Error(`Error al eliminar usuario: ${error.message}`);
    }
  }
}

module.exports = UserManager;

const bcrypt = require("bcrypt");
const { userRepository, cartRepository } = require("../repositories");
const { HttpError } = require("../utils/errors");

class UserService {
  constructor(users = userRepository, carts = cartRepository) {
    this.users = users;
    this.carts = carts;
  }

  hashPassword(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
  }

  async register({ first_name, last_name, email, age, password }) {
    if (await this.users.getUserByEmail(email)) throw new HttpError(400, "El usuario ya existe");

    const cart = await this.carts.createCart();
    return this.users.createUser({
      first_name,
      last_name,
      email,
      age,
      password: this.hashPassword(password),
      cart: cart._id
    });
  }

  // Devuelve { user } si las credenciales son correctas o { message } si no
  async validateCredentials(email, password) {
    const user = await this.users.getUserByEmail(email, { withPassword: true });
    if (!user) return { message: "Usuario no encontrado" };
    if (!user.isValidPassword(password)) return { message: "Contraseña incorrecta" };

    const userObj = user.toObject();
    delete userObj.password;
    return { user: userObj };
  }

  getUsers() {
    return this.users.getUsers();
  }

  getUserById(id) {
    return this.users.getUserById(id);
  }

  updateUser(id, data) {
    const updates = { ...data };
    if (updates.password) updates.password = this.hashPassword(updates.password);
    return this.users.updateUser(id, updates);
  }

  deleteUser(id) {
    return this.users.deleteUser(id);
  }
}

module.exports = UserService;

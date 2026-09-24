const User = require("../models/User");

// DAO: unico lugar que habla con Mongoose para usuarios. No contiene logica de negocio.
class UserDAO {
  create(data) {
    return User.create(data);
  }

  findAll() {
    return User.find();
  }

  findById(id, { withPassword = false } = {}) {
    const query = User.findById(id);
    return withPassword ? query.select("+password") : query;
  }

  findByEmail(email, { withPassword = false } = {}) {
    const query = User.findOne({ email: String(email).toLowerCase().trim() });
    return withPassword ? query.select("+password") : query;
  }

  update(id, data) {
    return User.findByIdAndUpdate(id, data, { returnDocument: "after", runValidators: true });
  }

  delete(id) {
    return User.findByIdAndDelete(id);
  }
}

module.exports = UserDAO;

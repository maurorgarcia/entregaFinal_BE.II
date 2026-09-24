// DTO para exponer al usuario logueado: solo datos no sensibles (sin password, timestamps ni datos internos)
class UserDTO {
  constructor(user) {
    this.id = String(user._id || user.id);
    this.first_name = user.first_name;
    this.last_name = user.last_name;
    this.email = user.email;
    this.age = user.age;
    this.role = user.role;
    this.cart = user.cart ? String(user.cart._id || user.cart) : null;
  }
}

module.exports = UserDTO;

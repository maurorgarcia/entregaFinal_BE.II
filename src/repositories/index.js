const UserRepository = require("./UserRepository");
const ProductRepository = require("./ProductRepository");
const CartRepository = require("./CartRepository");
const TicketRepository = require("./TicketRepository");
const PasswordResetRepository = require("./PasswordResetRepository");

module.exports = {
  userRepository: new UserRepository(),
  productRepository: new ProductRepository(),
  cartRepository: new CartRepository(),
  ticketRepository: new TicketRepository(),
  passwordResetRepository: new PasswordResetRepository()
};

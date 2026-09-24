const ProductService = require("./ProductService");
const CartService = require("./CartService");
const UserService = require("./UserService");
const PasswordService = require("./PasswordService");

module.exports = {
  productService: new ProductService(),
  cartService: new CartService(),
  userService: new UserService(),
  passwordService: new PasswordService()
};

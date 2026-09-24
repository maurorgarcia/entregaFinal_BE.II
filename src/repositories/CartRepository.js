const mongoose = require("mongoose");
const CartDAO = require("../dao/CartDAO");

class CartRepository {
  constructor(dao = new CartDAO()) {
    this.dao = dao;
  }

  isValidId(id) {
    return mongoose.isValidObjectId(id);
  }

  async createCart() {
    return this.format(await this.dao.create());
  }

  async getById(id, { populate = false } = {}) {
    if (!this.isValidId(id)) return null;
    const cart = await this.dao.findById(id, { populate });
    return cart ? this.format(cart) : null;
  }

  async setProducts(id, products, options) {
    if (!this.isValidId(id)) return null;
    const cart = await this.dao.setProducts(id, products, options);
    return cart ? this.format(cart) : null;
  }

  format(cart) {
    return {
      ...cart,
      _id: cart._id.toString(),
      id: cart._id.toString(),
      products: cart.products.map(item => ({ ...item, product: this.formatProduct(item.product) }))
    };
  }

  formatProduct(product) {
    // Un ObjectId sin popular tambien expone _id, por eso se lo distingue primero
    if (!product || product instanceof mongoose.Types.ObjectId || typeof product !== "object" || !product._id) {
      return product ? product.toString() : product;
    }
    return { ...product, _id: product._id.toString(), id: product._id.toString() };
  }
}

module.exports = CartRepository;

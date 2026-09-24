const Cart = require("../models/Cart");

class CartDAO {
  create() {
    return Cart.create({ products: [] }).then(cart => cart.toObject());
  }

  findById(id, { populate = false } = {}) {
    const query = Cart.findById(id);
    return (populate ? query.populate("products.product") : query).lean();
  }

  setProducts(id, products, { populate = true } = {}) {
    const query = Cart.findByIdAndUpdate(id, { products }, { returnDocument: "after", runValidators: true });
    return (populate ? query.populate("products.product") : query).lean();
  }
}

module.exports = CartDAO;

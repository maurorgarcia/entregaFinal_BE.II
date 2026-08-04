const mongoose = require("mongoose");
const Cart = require("../models/Cart");

class CartManager {
  async getCarts() {
    const carts = await Cart.find().lean();
    return carts.map(cart => this.formatCart(cart));
  }

  async getCartById(id) {
    if (!this.isValidObjectId(id)) {
      return null;
    }

    const cart = await Cart.findById(id).lean();
    return cart ? this.formatCart(cart) : null;
  }

  async getCartByIdPopulated(id) {
    if (!this.isValidObjectId(id)) {
      return null;
    }

    const cart = await Cart.findById(id).populate("products.product").lean();
    return cart ? this.formatCart(cart) : null;
  }

  async createCart() {
    const cart = await Cart.create({ products: [] });
    return this.formatCart(cart.toObject());
  }

  async addProductToCart(cartId, productId) {
    if (!this.isValidObjectId(cartId) || !this.isValidObjectId(productId)) {
      return null;
    }

    const cart = await Cart.findById(cartId);

    if (!cart) {
      return null;
    }

    const productInCart = cart.products.find(item => item.product.toString() === productId);

    if (productInCart) {
      productInCart.quantity += 1;
    } else {
      cart.products.push({
        product: productId,
        quantity: 1
      });
    }

    await cart.save();
    const updatedCart = await Cart.findById(cartId).populate("products.product").lean();
    return this.formatCart(updatedCart);
  }

  async deleteProductFromCart(cartId, productId) {
    if (!this.isValidObjectId(cartId) || !this.isValidObjectId(productId)) {
      return null;
    }

    const updatedCart = await Cart.findByIdAndUpdate(
      cartId,
      { $pull: { products: { product: productId } } },
      { new: true }
    ).populate("products.product").lean();

    return updatedCart ? this.formatCart(updatedCart) : null;
  }

  async updateCartProducts(cartId, products) {
    if (!this.isValidObjectId(cartId) || !Array.isArray(products)) {
      return null;
    }

    const normalizedProducts = products.map(item => ({
      product: item.product || item._id,
      quantity: Number(item.quantity)
    }));

    const hasInvalidProduct = normalizedProducts.some(
      item => !this.isValidObjectId(item.product) || !Number.isInteger(item.quantity) || item.quantity < 1
    );

    if (hasInvalidProduct) {
      throw new Error("El arreglo de productos debe incluir product y quantity validos");
    }

    const updatedCart = await Cart.findByIdAndUpdate(
      cartId,
      { products: normalizedProducts },
      { new: true, runValidators: true }
    ).populate("products.product").lean();

    return updatedCart ? this.formatCart(updatedCart) : null;
  }

  async updateProductQuantity(cartId, productId, quantity) {
    if (!this.isValidObjectId(cartId) || !this.isValidObjectId(productId)) {
      return null;
    }

    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      throw new Error("La cantidad debe ser un numero entero mayor a 0");
    }

    const cart = await Cart.findOneAndUpdate(
      { _id: cartId, "products.product": productId },
      { $set: { "products.$.quantity": parsedQuantity } },
      { new: true, runValidators: true }
    ).populate("products.product").lean();

    return cart ? this.formatCart(cart) : null;
  }

  async clearCart(cartId) {
    if (!this.isValidObjectId(cartId)) {
      return null;
    }

    const updatedCart = await Cart.findByIdAndUpdate(
      cartId,
      { products: [] },
      { new: true }
    ).lean();

    return updatedCart ? this.formatCart(updatedCart) : null;
  }

  isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
  }

  formatCart(cart) {
    return {
      ...cart,
      _id: cart._id.toString(),
      id: cart._id.toString(),
      products: cart.products.map(item => ({
        ...item,
        product: this.formatProductReference(item.product)
      }))
    };
  }

  formatProductReference(product) {
    if (!product || typeof product !== "object" || !product._id) {
      return product ? product.toString() : product;
    }

    return {
      ...product,
      _id: product._id.toString(),
      id: product._id.toString()
    };
  }
}

module.exports = CartManager;

const { cartRepository, productRepository, ticketRepository } = require("../repositories");
const { HttpError } = require("../utils/errors");

class CartService {
  constructor(carts = cartRepository, products = productRepository, tickets = ticketRepository) {
    this.carts = carts;
    this.products = products;
    this.tickets = tickets;
  }

  createCart() {
    return this.carts.createCart();
  }

  async getCart(cartId, { populate = true } = {}) {
    const cart = await this.carts.getById(cartId, { populate });
    if (!cart) throw new HttpError(404, "Carrito no encontrado");
    return cart;
  }

  async addProduct(cartId, productId) {
    const product = await this.products.getById(productId);
    if (!product) throw new HttpError(404, "Producto no encontrado");

    const cart = await this.getCart(cartId, { populate: false });
    const items = cart.products.map(item => ({ product: item.product, quantity: item.quantity }));
    const existing = items.find(item => item.product === productId);

    if (existing) existing.quantity += 1;
    else items.push({ product: productId, quantity: 1 });

    return this.carts.setProducts(cartId, items);
  }

  async removeProduct(cartId, productId) {
    const cart = await this.getCart(cartId, { populate: false });
    const items = cart.products
      .filter(item => item.product !== productId)
      .map(item => ({ product: item.product, quantity: item.quantity }));
    return this.carts.setProducts(cartId, items);
  }

  async replaceProducts(cartId, products) {
    if (!Array.isArray(products)) {
      throw new HttpError(400, "El arreglo de productos debe incluir product y quantity validos");
    }

    const items = products.map(item => ({
      product: String(item.product || item._id || ""),
      quantity: Number(item.quantity)
    }));

    const invalid = items.some(
      item => !this.products.isValidId(item.product) || !Number.isInteger(item.quantity) || item.quantity < 1
    );
    if (invalid) throw new HttpError(400, "El arreglo de productos debe incluir product y quantity validos");

    await this.getCart(cartId, { populate: false });
    return this.carts.setProducts(cartId, items);
  }

  async updateQuantity(cartId, productId, quantity) {
    const parsed = Number(quantity);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new HttpError(400, "La cantidad debe ser un numero entero mayor a 0");
    }

    const cart = await this.getCart(cartId, { populate: false });
    if (!cart.products.some(item => item.product === productId)) {
      throw new HttpError(404, "Carrito o producto no encontrado");
    }

    const items = cart.products.map(item => ({
      product: item.product,
      quantity: item.product === productId ? parsed : item.quantity
    }));
    return this.carts.setProducts(cartId, items);
  }

  async clearCart(cartId) {
    await this.getCart(cartId, { populate: false });
    return this.carts.setProducts(cartId, []);
  }

  // Compra: los productos con stock suficiente se compran (y descuentan stock),
  // el resto queda en el carrito. Devuelve el ticket y los ids que no se pudieron comprar.
  async purchase(cartId, purchaserEmail) {
    const cart = await this.getCart(cartId, { populate: true });

    if (cart.products.length === 0) throw new HttpError(400, "El carrito esta vacio");

    const purchased = [];
    const notPurchased = [];

    for (const item of cart.products) {
      const product = item.product;

      // Producto eliminado del catalogo: no se puede comprar
      if (!product || typeof product !== "object") {
        notPurchased.push({ product: item.product, quantity: item.quantity });
        continue;
      }

      // Descuento atomico: solo se aplica si el stock alcanza
      const updated = await this.products.reserveStock(product._id, item.quantity);
      if (updated) {
        purchased.push({ product: product._id, title: product.title, price: product.price, quantity: item.quantity });
      } else {
        notPurchased.push({ product: product._id, quantity: item.quantity });
      }
    }

    if (purchased.length === 0) {
      throw new HttpError(409, "Ninguno de los productos del carrito tiene stock suficiente");
    }

    const amount = purchased.reduce((total, item) => total + item.price * item.quantity, 0);
    const ticket = await this.tickets.createTicket({ amount, purchaser: purchaserEmail, items: purchased });

    // En el carrito solo quedan los productos que no se pudieron comprar
    // (se descartan referencias a productos que ya no existen en el catalogo)
    const remaining = notPurchased.filter(item => typeof item.product === "string");
    await this.carts.setProducts(cartId, remaining, { populate: false });

    return { ticket, notPurchased: remaining.map(item => item.product) };
  }
}

module.exports = CartService;

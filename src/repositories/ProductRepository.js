const mongoose = require("mongoose");
const ProductDAO = require("../dao/ProductDAO");

class ProductRepository {
  constructor(dao = new ProductDAO()) {
    this.dao = dao;
  }

  isValidId(id) {
    return mongoose.isValidObjectId(id);
  }

  async getAll() {
    return (await this.dao.findAll()).map(p => this.format(p));
  }

  count(filter) {
    return this.dao.count(filter);
  }

  async getPage(filter, sort, skip, limit) {
    return (await this.dao.findPage(filter, sort, skip, limit)).map(p => this.format(p));
  }

  async getById(id) {
    if (!this.isValidId(id)) return null;
    const product = await this.dao.findById(id);
    return product ? this.format(product) : null;
  }

  async create(data) {
    return this.format(await this.dao.create(data));
  }

  async update(id, data) {
    if (!this.isValidId(id)) return null;
    const product = await this.dao.update(id, data);
    return product ? this.format(product) : null;
  }

  async delete(id) {
    if (!this.isValidId(id)) return null;
    return (await this.dao.delete(id)) ? true : null;
  }

  // Devuelve el producto actualizado o null si no habia stock suficiente
  async reserveStock(id, quantity) {
    const product = await this.dao.decrementStock(id, quantity);
    return product ? this.format(product) : null;
  }

  format(product) {
    return { ...product, _id: product._id.toString(), id: product._id.toString() };
  }
}

module.exports = ProductRepository;

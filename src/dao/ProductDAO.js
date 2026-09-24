const Product = require("../models/Product");

class ProductDAO {
  findAll() {
    return Product.find().lean();
  }

  count(filter = {}) {
    return Product.countDocuments(filter);
  }

  findPage(filter, sort, skip, limit) {
    return Product.find(filter).sort(sort).skip(skip).limit(limit).lean();
  }

  findById(id) {
    return Product.findById(id).lean();
  }

  async create(data) {
    const product = await Product.create(data);
    return product.toObject();
  }

  update(id, data) {
    return Product.findByIdAndUpdate(id, data, { returnDocument: "after", runValidators: true }).lean();
  }

  delete(id) {
    return Product.findByIdAndDelete(id).lean();
  }

  // Descuenta stock de forma atomica: solo si alcanza. Devuelve null si no habia stock suficiente.
  decrementStock(id, quantity) {
    return Product.findOneAndUpdate(
      { _id: id, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { returnDocument: "after" }
    ).lean();
  }
}

module.exports = ProductDAO;

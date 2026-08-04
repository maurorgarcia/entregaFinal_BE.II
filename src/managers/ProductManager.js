const Product = require("../models/Product");

class ProductManager {
  async getProducts(options = {}) {
    const {
      limit,
      page,
      sort,
      query,
      paginated = false,
      baseUrl = "/api/products"
    } = options;

    if (!paginated) {
      const products = await Product.find().lean();
      return products.map(product => this.formatProduct(product));
    }

    const parsedLimit = Number(limit) > 0 ? Number(limit) : 10;
    const parsedPage = Number(page) > 0 ? Number(page) : 1;
    const filter = this.buildFilter(query);
    const sortOptions = this.buildSort(sort);

    const totalDocs = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalDocs / parsedLimit) || 1;
    const products = await Product.find(filter)
      .sort(sortOptions)
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit)
      .lean();

    const hasPrevPage = parsedPage > 1;
    const hasNextPage = parsedPage < totalPages;
    const prevPage = hasPrevPage ? parsedPage - 1 : null;
    const nextPage = hasNextPage ? parsedPage + 1 : null;

    return {
      status: "success",
      payload: products.map(product => this.formatProduct(product)),
      totalPages,
      prevPage,
      nextPage,
      page: parsedPage,
      hasPrevPage,
      hasNextPage,
      prevLink: hasPrevPage
        ? this.buildPageLink(baseUrl, { limit: parsedLimit, page: prevPage, sort, query })
        : null,
      nextLink: hasNextPage
        ? this.buildPageLink(baseUrl, { limit: parsedLimit, page: nextPage, sort, query })
        : null
    };
  }

  async getProductById(id) {
    if (!this.isValidObjectId(id)) {
      return null;
    }

    const product = await Product.findById(id).lean();
    return product ? this.formatProduct(product) : null;
  }

  async addProduct(productData) {
    this.validateProductData(productData);

    try {
      const newProduct = await Product.create({
        title: productData.title,
        description: productData.description,
        code: productData.code,
        price: productData.price,
        status: productData.status !== undefined ? productData.status : true,
        stock: productData.stock,
        category: productData.category,
        thumbnails: productData.thumbnails || []
      });

      return this.formatProduct(newProduct.toObject());
    } catch (error) {
      if (error.code === 11000) {
        throw new Error("Ya existe un producto con ese codigo");
      }

      throw error;
    }
  }

  async updateProduct(id, updatedFields) {
    if (!this.isValidObjectId(id)) {
      return null;
    }

    delete updatedFields.id;
    delete updatedFields._id;

    if (updatedFields.price !== undefined) {
      this.validatePrice(updatedFields.price);
    }

    if (updatedFields.stock !== undefined) {
      this.validateStock(updatedFields.stock);
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updatedFields, {
      new: true,
      runValidators: true
    }).lean();

    return updatedProduct ? this.formatProduct(updatedProduct) : null;
  }

  async deleteProduct(id) {
    if (!this.isValidObjectId(id)) {
      return null;
    }

    const deletedProduct = await Product.findByIdAndDelete(id).lean();
    return deletedProduct ? true : null;
  }

  buildFilter(query) {
    if (!query) {
      return {};
    }

    const normalizedQuery = String(query).trim();

    if (["true", "false"].includes(normalizedQuery.toLowerCase())) {
      return { status: normalizedQuery.toLowerCase() === "true" };
    }

    return { category: { $regex: new RegExp(`^${this.escapeRegex(normalizedQuery)}$`, "i") } };
  }

  buildSort(sort) {
    if (sort === "asc") {
      return { price: 1 };
    }

    if (sort === "desc") {
      return { price: -1 };
    }

    return undefined;
  }

  buildPageLink(baseUrl, params) {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, value);
      }
    });

    return `${baseUrl}?${searchParams.toString()}`;
  }

  validateProductData(productData) {
    const requiredFields = ["title", "description", "code", "price", "stock", "category"];

    for (const field of requiredFields) {
      if (productData[field] === undefined || productData[field] === null || productData[field] === "") {
        throw new Error(`El campo ${field} es obligatorio`);
      }
    }

    this.validatePrice(productData.price);
    this.validateStock(productData.stock);
  }

  validatePrice(price) {
    if (typeof price !== "number" || price <= 0) {
      throw new Error("El precio debe ser un numero mayor a 0");
    }
  }

  validateStock(stock) {
    if (typeof stock !== "number" || stock < 0) {
      throw new Error("El stock debe ser un numero mayor o igual a 0");
    }
  }

  isValidObjectId(id) {
    return Product.db.base.Types.ObjectId.isValid(id);
  }

  escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  formatProduct(product) {
    return {
      ...product,
      _id: product._id.toString(),
      id: product._id.toString()
    };
  }
}

module.exports = ProductManager;

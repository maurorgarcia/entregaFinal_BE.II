const { productRepository } = require("../repositories");
const { HttpError } = require("../utils/errors");

class ProductService {
  constructor(repository = productRepository) {
    this.repository = repository;
  }

  async getProducts({ limit, page, sort, query, paginated = false, baseUrl = "/api/products" } = {}) {
    if (!paginated) return this.repository.getAll();

    const parsedLimit = Number(limit) > 0 ? Number(limit) : 10;
    const parsedPage = Number(page) > 0 ? Number(page) : 1;
    const filter = this.buildFilter(query);

    const totalDocs = await this.repository.count(filter);
    const totalPages = Math.ceil(totalDocs / parsedLimit) || 1;
    const payload = await this.repository.getPage(
      filter,
      this.buildSort(sort),
      (parsedPage - 1) * parsedLimit,
      parsedLimit
    );

    const hasPrevPage = parsedPage > 1;
    const hasNextPage = parsedPage < totalPages;
    const prevPage = hasPrevPage ? parsedPage - 1 : null;
    const nextPage = hasNextPage ? parsedPage + 1 : null;

    return {
      status: "success",
      payload,
      totalPages,
      prevPage,
      nextPage,
      page: parsedPage,
      hasPrevPage,
      hasNextPage,
      prevLink: hasPrevPage ? this.buildPageLink(baseUrl, { limit: parsedLimit, page: prevPage, sort, query }) : null,
      nextLink: hasNextPage ? this.buildPageLink(baseUrl, { limit: parsedLimit, page: nextPage, sort, query }) : null
    };
  }

  getProductById(id) {
    return this.repository.getById(id);
  }

  async addProduct(data) {
    this.validateProductData(data);

    try {
      return await this.repository.create({
        title: data.title,
        description: data.description,
        code: data.code,
        price: data.price,
        status: data.status !== undefined ? data.status : true,
        stock: data.stock,
        category: data.category,
        thumbnails: data.thumbnails || []
      });
    } catch (error) {
      if (error.code === 11000) throw new HttpError(400, "Ya existe un producto con ese codigo");
      throw error;
    }
  }

  async updateProduct(id, fields) {
    const updates = { ...fields };
    delete updates.id;
    delete updates._id;

    if (updates.price !== undefined) this.validatePrice(updates.price);
    if (updates.stock !== undefined) this.validateStock(updates.stock);

    try {
      return await this.repository.update(id, updates);
    } catch (error) {
      if (error.name === "ValidationError") throw new HttpError(400, error.message);
      if (error.code === 11000) throw new HttpError(400, "Ya existe un producto con ese codigo");
      throw error;
    }
  }

  deleteProduct(id) {
    return this.repository.delete(id);
  }

  buildFilter(query) {
    if (!query) return {};
    const normalized = String(query).trim();
    if (["true", "false"].includes(normalized.toLowerCase())) {
      return { status: normalized.toLowerCase() === "true" };
    }
    return { category: { $regex: new RegExp(`^${this.escapeRegex(normalized)}$`, "i") } };
  }

  buildSort(sort) {
    if (sort === "asc") return { price: 1 };
    if (sort === "desc") return { price: -1 };
    return undefined;
  }

  buildPageLink(baseUrl, params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") searchParams.set(key, value);
    });
    return `${baseUrl}?${searchParams.toString()}`;
  }

  validateProductData(data) {
    const required = ["title", "description", "code", "price", "stock", "category"];
    for (const field of required) {
      if (data[field] === undefined || data[field] === null || data[field] === "") {
        throw new HttpError(400, `El campo ${field} es obligatorio`);
      }
    }
    this.validatePrice(data.price);
    this.validateStock(data.stock);
  }

  validatePrice(price) {
    if (typeof price !== "number" || price <= 0) {
      throw new HttpError(400, "El precio debe ser un numero mayor a 0");
    }
  }

  validateStock(stock) {
    if (typeof stock !== "number" || stock < 0) {
      throw new HttpError(400, "El stock debe ser un numero mayor o igual a 0");
    }
  }

  escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}

module.exports = ProductService;

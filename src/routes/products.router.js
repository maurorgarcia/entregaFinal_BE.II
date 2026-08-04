const express = require("express");
const ProductManager = require("../managers/ProductManager");

const router = express.Router();
const productManager = new ProductManager();

router.get("/", async (req, res) => {
  try {
    const { limit, page, sort, query } = req.query;
    const result = await productManager.getProducts({
      limit,
      page,
      sort,
      query,
      paginated: true,
      baseUrl: `${req.protocol}://${req.get("host")}${req.baseUrl}`
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error al obtener los productos"
    });
  }
});

router.get("/:pid", async (req, res) => {
  try {
    const { pid } = req.params;

    const product = await productManager.getProductById(pid);

    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Producto no encontrado"
      });
    }

    res.json({
      status: "success",
      payload: product
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error al obtener el producto"
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const newProduct = await productManager.addProduct(req.body);

    // Si se agrega por HTTP POST, actualizamos los websockets
    const io = req.app.get('socketio');
    const updatedProducts = await productManager.getProducts();
    io.emit('updateProducts', updatedProducts);

    res.status(201).json({
      status: "success",
      message: "Producto creado correctamente",
      payload: newProduct
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message
    });
  }
});

router.put("/:pid", async (req, res) => {
  try {
    const { pid } = req.params;

    const updatedProduct = await productManager.updateProduct(pid, req.body);

    if (!updatedProduct) {
      return res.status(404).json({
        status: "error",
        message: "Producto no encontrado"
      });
    }

    res.json({
      status: "success",
      message: "Producto actualizado correctamente",
      payload: updatedProduct
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message
    });
  }
});

router.delete("/:pid", async (req, res) => {
  try {
    const { pid } = req.params;

    const result = await productManager.deleteProduct(pid);

    if (!result) {
      return res.status(404).json({
        status: "error",
        message: "Producto no encontrado"
      });
    }

    // Si se elimina por HTTP DELETE, actualizamos los websockets
    const io = req.app.get('socketio');
    const updatedProducts = await productManager.getProducts();
    io.emit('updateProducts', updatedProducts);

    res.json({
      status: "success",
      message: "Producto eliminado correctamente"
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error al eliminar el producto"
    });
  }
});

module.exports = router;

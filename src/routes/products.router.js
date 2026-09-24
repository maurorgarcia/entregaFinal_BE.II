const express = require("express");
const { productService } = require("../services");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { sendError } = require("../utils/errors");

const router = express.Router();

const notifyProducts = async req => {
  const io = req.app.get("socketio");
  if (io) io.emit("updateProducts", await productService.getProducts());
};

router.get("/", async (req, res) => {
  try {
    const { limit, page, sort, query } = req.query;
    const result = await productService.getProducts({
      limit,
      page,
      sort,
      query,
      paginated: true,
      baseUrl: `${req.protocol}://${req.get("host")}${req.baseUrl}`
    });

    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/:pid", async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.pid);

    if (!product) {
      return res.status(404).json({ status: "error", message: "Producto no encontrado" });
    }

    res.json({ status: "success", payload: product });
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/", authenticate("current"), authorize("admin"), async (req, res) => {
  try {
    const newProduct = await productService.addProduct(req.body);
    await notifyProducts(req);

    res.status(201).json({
      status: "success",
      message: "Producto creado correctamente",
      payload: newProduct
    });
  } catch (error) {
    sendError(res, error);
  }
});

router.put("/:pid", authenticate("current"), authorize("admin"), async (req, res) => {
  try {
    const updatedProduct = await productService.updateProduct(req.params.pid, req.body);

    if (!updatedProduct) {
      return res.status(404).json({ status: "error", message: "Producto no encontrado" });
    }

    await notifyProducts(req);

    res.json({
      status: "success",
      message: "Producto actualizado correctamente",
      payload: updatedProduct
    });
  } catch (error) {
    sendError(res, error);
  }
});

router.delete("/:pid", authenticate("current"), authorize("admin"), async (req, res) => {
  try {
    const result = await productService.deleteProduct(req.params.pid);

    if (!result) {
      return res.status(404).json({ status: "error", message: "Producto no encontrado" });
    }

    await notifyProducts(req);

    res.json({ status: "success", message: "Producto eliminado correctamente" });
  } catch (error) {
    sendError(res, error);
  }
});

module.exports = router;

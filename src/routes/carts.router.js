const express = require("express");
const CartManager = require("../managers/CartManager");
const ProductManager = require("../managers/ProductManager");

const router = express.Router();

const cartManager = new CartManager();
const productManager = new ProductManager();

router.post("/", async (req, res) => {
  try {
    const newCart = await cartManager.createCart();

    res.status(201).json({
      status: "success",
      message: "Carrito creado correctamente",
      payload: newCart
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error al crear el carrito"
    });
  }
});

router.get("/:cid", async (req, res) => {
  try {
    const { cid } = req.params;

    const cart = await cartManager.getCartByIdPopulated(cid);

    if (!cart) {
      return res.status(404).json({
        status: "error",
        message: "Carrito no encontrado"
      });
    }

    res.json({
      status: "success",
      payload: cart.products
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error al obtener el carrito"
    });
  }
});

async function addProductToCart(req, res) {
  try {
    const { cid, pid } = req.params;

    const product = await productManager.getProductById(pid);

    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Producto no encontrado"
      });
    }

    const updatedCart = await cartManager.addProductToCart(cid, pid);

    if (!updatedCart) {
      return res.status(404).json({
        status: "error",
        message: "Carrito no encontrado"
      });
    }

    res.json({
      status: "success",
      message: "Producto agregado al carrito correctamente",
      payload: updatedCart
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error al agregar el producto al carrito"
    });
  }
}

router.post("/:cid/product/:pid", addProductToCart);
router.post("/:cid/products/:pid", addProductToCart);

router.delete("/:cid/products/:pid", async (req, res) => {
  try {
    const { cid, pid } = req.params;
    const updatedCart = await cartManager.deleteProductFromCart(cid, pid);

    if (!updatedCart) {
      return res.status(404).json({
        status: "error",
        message: "Carrito no encontrado"
      });
    }

    res.json({
      status: "success",
      message: "Producto eliminado del carrito correctamente",
      payload: updatedCart
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error al eliminar el producto del carrito"
    });
  }
});

router.put("/:cid", async (req, res) => {
  try {
    const { cid } = req.params;
    const updatedCart = await cartManager.updateCartProducts(cid, req.body);

    if (!updatedCart) {
      return res.status(404).json({
        status: "error",
        message: "Carrito no encontrado"
      });
    }

    res.json({
      status: "success",
      message: "Carrito actualizado correctamente",
      payload: updatedCart
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message
    });
  }
});

router.put("/:cid/products/:pid", async (req, res) => {
  try {
    const { cid, pid } = req.params;
    const { quantity } = req.body;

    const updatedCart = await cartManager.updateProductQuantity(cid, pid, quantity);

    if (!updatedCart) {
      return res.status(404).json({
        status: "error",
        message: "Carrito o producto no encontrado"
      });
    }

    res.json({
      status: "success",
      message: "Cantidad actualizada correctamente",
      payload: updatedCart
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message
    });
  }
});

router.delete("/:cid", async (req, res) => {
  try {
    const { cid } = req.params;
    const updatedCart = await cartManager.clearCart(cid);

    if (!updatedCart) {
      return res.status(404).json({
        status: "error",
        message: "Carrito no encontrado"
      });
    }

    res.json({
      status: "success",
      message: "Productos eliminados del carrito correctamente",
      payload: updatedCart
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error al vaciar el carrito"
    });
  }
});

module.exports = router;

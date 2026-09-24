const express = require("express");
const { cartService } = require("../services");
const mailService = require("../services/MailService");
const { authenticate, authorize, ownsCart } = require("../middleware/auth.middleware");
const { sendError } = require("../utils/errors");

const router = express.Router();

// Solo el usuario (no el admin) opera sobre su propio carrito
const userOwnsCart = [authenticate("current"), authorize("user"), ownsCart];

router.post("/", authenticate("current"), async (req, res) => {
  try {
    const newCart = await cartService.createCart();
    res.status(201).json({ status: "success", message: "Carrito creado correctamente", payload: newCart });
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/:cid", authenticate("current"), async (req, res) => {
  try {
    const { cid } = req.params;
    const userCart = req.user.cart && String(req.user.cart._id || req.user.cart);
    if (req.user.role !== "admin" && userCart !== cid) {
      return res.status(403).json({ status: "error", message: "Solo podes ver tu propio carrito" });
    }

    const cart = await cartService.getCart(cid);
    res.json({ status: "success", payload: cart.products });
  } catch (error) {
    sendError(res, error);
  }
});

async function addProductToCart(req, res) {
  try {
    const { cid, pid } = req.params;
    const updatedCart = await cartService.addProduct(cid, pid);
    res.json({ status: "success", message: "Producto agregado al carrito correctamente", payload: updatedCart });
  } catch (error) {
    sendError(res, error);
  }
}

router.post("/:cid/product/:pid", userOwnsCart, addProductToCart);
router.post("/:cid/products/:pid", userOwnsCart, addProductToCart);

router.delete("/:cid/products/:pid", userOwnsCart, async (req, res) => {
  try {
    const updatedCart = await cartService.removeProduct(req.params.cid, req.params.pid);
    res.json({ status: "success", message: "Producto eliminado del carrito correctamente", payload: updatedCart });
  } catch (error) {
    sendError(res, error);
  }
});

router.put("/:cid", userOwnsCart, async (req, res) => {
  try {
    const updatedCart = await cartService.replaceProducts(req.params.cid, req.body);
    res.json({ status: "success", message: "Carrito actualizado correctamente", payload: updatedCart });
  } catch (error) {
    sendError(res, error);
  }
});

router.put("/:cid/products/:pid", userOwnsCart, async (req, res) => {
  try {
    const updatedCart = await cartService.updateQuantity(req.params.cid, req.params.pid, req.body.quantity);
    res.json({ status: "success", message: "Cantidad actualizada correctamente", payload: updatedCart });
  } catch (error) {
    sendError(res, error);
  }
});

router.delete("/:cid", userOwnsCart, async (req, res) => {
  try {
    const updatedCart = await cartService.clearCart(req.params.cid);
    res.json({ status: "success", message: "Productos eliminados del carrito correctamente", payload: updatedCart });
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/:cid/purchase", userOwnsCart, async (req, res) => {
  try {
    const { ticket, notPurchased } = await cartService.purchase(req.params.cid, req.user.email);

    // El mail de confirmacion no debe romper una compra ya realizada
    mailService.sendPurchaseTicket(req.user.email, ticket).catch(error =>
      console.error("No se pudo enviar el mail del ticket:", error.message)
    );

    res.json({
      status: "success",
      message: notPurchased.length
        ? "Compra parcial: algunos productos no tenian stock suficiente y siguen en tu carrito"
        : "Compra realizada con exito",
      payload: { ticket, notPurchased }
    });
  } catch (error) {
    sendError(res, error);
  }
});

module.exports = router;

const addToCartForm = document.querySelector(".add-to-cart-form");

if (addToCartForm) {
  addToCartForm.addEventListener("submit", async event => {
    event.preventDefault();

    const productId = addToCartForm.dataset.productId;
    const cartId = addToCartForm.elements.cartId.value;
    const message = document.querySelector(".cart-message");

    try {
      const response = await fetch(`/api/carts/${cartId}/products/${productId}`, {
        method: "POST"
      });
      const result = await response.json();

      message.textContent = result.message || "Producto agregado";
    } catch (error) {
      message.textContent = "No se pudo agregar el producto al carrito";
    }
  });
}

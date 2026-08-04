const socket = io();

socket.on("updateProducts", products => {
  const productList = document.getElementById("productList");
  productList.innerHTML = "";

  products.forEach(product => {
    const productId = product._id || product.id;
    const li = document.createElement("li");
    li.style.marginBottom = "10px";
    li.innerHTML = `
      <strong>${product.title}</strong> - $${product.price} <br>
      Categoria: ${product.category} | Stock: ${product.stock} <br>
      Codigo: ${product.code} | ID: ${productId}
      <button onclick="deleteProduct('${productId}')" style="margin-left: 10px;">Eliminar</button>
    `;
    productList.appendChild(li);
  });
});

document.getElementById("productForm").addEventListener("submit", event => {
  event.preventDefault();

  const product = {
    title: document.getElementById("title").value,
    description: document.getElementById("description").value,
    code: document.getElementById("code").value,
    price: parseFloat(document.getElementById("price").value),
    stock: parseInt(document.getElementById("stock").value, 10),
    category: document.getElementById("category").value
  };

  socket.emit("addProduct", product);
  document.getElementById("productForm").reset();
});

function deleteProduct(id) {
  socket.emit("deleteProduct", id);
}

socket.on("error", errorMessage => {
  alert(errorMessage);
});

const fs = require("fs").promises;
const path = require("path");
const mongoose = require("mongoose");
const Product = require("../src/models/Product");

const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/entrega_final_backend";

async function seedProducts() {
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000
  });

  const filePath = path.join(__dirname, "../src/data/products.json");
  const rawProducts = JSON.parse(await fs.readFile(filePath, "utf-8"));
  let insertedProducts = 0;

  for (const product of rawProducts) {
    const exists = await Product.exists({ code: product.code });

    if (!exists) {
      await Product.create({
        title: product.title,
        description: product.description,
        code: product.code,
        price: product.price,
        status: product.status,
        stock: product.stock,
        category: product.category,
        thumbnails: product.thumbnails || []
      });
      insertedProducts += 1;
    }
  }

  console.log(`Seed finalizado. Productos insertados: ${insertedProducts}`);
  await mongoose.disconnect();
}

seedProducts().catch(async error => {
  console.error("Error al ejecutar el seed:", error.message);
  await mongoose.disconnect();
  process.exit(1);
});

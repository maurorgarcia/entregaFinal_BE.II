const mongoose = require("mongoose");

const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/entrega1_be2";

async function connectDB() {
  try {
    // Intentamos conectar a la URI configurada (local o Atlas)
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log("MongoDB conectado correctamente (Base de datos local/Atlas)");
  } catch (error) {
    console.log("MongoDB local no detectado. Iniciando MongoDB en memoria (MongoMemoryServer) para pruebas de desarrollo...");
    try {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();
      await mongoose.connect(memoryUri);
      console.log("MongoDB en memoria conectado correctamente. Servidor listo para probar.");
    } catch (memError) {
      console.error("Error al conectar con MongoDB en memoria:", memError.message);
      process.exit(1);
    }
  }
}

module.exports = connectDB;

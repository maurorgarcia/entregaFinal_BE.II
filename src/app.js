require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const exphbs = require('express-handlebars');
const path = require('path');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const initializePassport = require('./config/passport.config');

const connectDB = require('./config/db');
const productsRouter = require('./routes/products.router');
const cartsRouter = require('./routes/carts.router');
const viewsRouter = require('./routes/views.router');
const sessionsRouter = require('./routes/sessions.router');
const usersRouter = require('./routes/users.router');
const ProductManager = require('./managers/ProductManager');

const app = express();
const port = 8080;
const httpServer = createServer(app);
const io = new Server(httpServer);
const productManager = new ProductManager();

// Guardamos 'io' en 'app' para poder usarlo desde los routers
app.set('socketio', io);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

initializePassport();
app.use(passport.initialize());

app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

app.use("/", viewsRouter);
app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/users", usersRouter);

io.on('connection', async (socket) => {
  console.log('Nuevo cliente conectado');

  const products = await productManager.getProducts();
  socket.emit('updateProducts', products);

  socket.on('addProduct', async (product) => {
    try {
      // Check required types for price and stock
      if (typeof product.price === 'string') product.price = parseFloat(product.price);
      if (typeof product.stock === 'string') product.stock = parseInt(product.stock, 10);
      
      await productManager.addProduct(product);
      const updatedProducts = await productManager.getProducts();
      io.emit('updateProducts', updatedProducts);
    } catch (error) {
      console.error('Error al agregar producto:', error.message);
      socket.emit('error', error.message);
    }
  });

  socket.on('deleteProduct', async (id) => {
    try {
      await productManager.deleteProduct(id);
      const updatedProducts = await productManager.getProducts();
      io.emit('updateProducts', updatedProducts);
    } catch (error) {
      console.error('Error al eliminar producto:', error.message);
      socket.emit('error', error.message);
    }
  });
});

// Solo levantamos el servidor si se ejecuta directamente (permite importar app en los tests)
if (require.main === module) {
  connectDB().then(() => {
    httpServer.listen(port, () => {
      console.log(`Servidor escuchando en el puerto ${port}`);
    });
  });
}

module.exports = app;

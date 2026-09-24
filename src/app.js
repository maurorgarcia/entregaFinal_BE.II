const config = require('./config/config');
const express = require('express');
const jwt = require('jsonwebtoken');
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
const { productService, userService } = require('./services');

const app = express();
const port = config.port;
const httpServer = createServer(app);
const io = new Server(httpServer);

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

// Autenticacion del socket con la misma cookie JWT: solo un admin puede crear o eliminar productos
const readCookie = (header = '', name) => {
  const match = header.split(';').map(c => c.trim()).find(c => c.startsWith(name + '='));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
};

io.use(async (socket, next) => {
  try {
    const token = readCookie(socket.handshake.headers.cookie, 'jwt');
    if (token) {
      const payload = jwt.verify(token, config.jwtSecret);
      socket.user = await userService.getUserById(payload._id);
    }
  } catch (error) {
    socket.user = null;
  }
  next();
});

const requireAdmin = (socket) => {
  if (!socket.user || socket.user.role !== 'admin') {
    socket.emit('error', 'Solo un administrador puede realizar esta accion');
    return false;
  }
  return true;
};

io.on('connection', async (socket) => {
  console.log('Nuevo cliente conectado');

  const products = await productService.getProducts();
  socket.emit('updateProducts', products);

  socket.on('addProduct', async (product) => {
    if (!requireAdmin(socket)) return;
    try {
      // Check required types for price and stock
      if (typeof product.price === 'string') product.price = parseFloat(product.price);
      if (typeof product.stock === 'string') product.stock = parseInt(product.stock, 10);
      
      await productService.addProduct(product);
      const updatedProducts = await productService.getProducts();
      io.emit('updateProducts', updatedProducts);
    } catch (error) {
      console.error('Error al agregar producto:', error.message);
      socket.emit('error', error.message);
    }
  });

  socket.on('deleteProduct', async (id) => {
    if (!requireAdmin(socket)) return;
    try {
      await productService.deleteProduct(id);
      const updatedProducts = await productService.getProducts();
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

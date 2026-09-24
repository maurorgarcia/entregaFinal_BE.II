const express = require('express');
const router = express.Router();
const { productService, cartService } = require('../services');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/', async (req, res) => {
  res.redirect('/products');
});

router.get('/products', async (req, res) => {
  const { limit, page, sort, query } = req.query;
  const result = await productService.getProducts({
    limit,
    page,
    sort,
    query,
    paginated: true,
    baseUrl: '/products'
  });

  res.render('index', {
    title: 'Productos',
    products: result.payload,
    pagination: result,
    limit: limit || 10,
    sort,
    query
  });
});

router.get('/products/:pid', async (req, res) => {
  const { pid } = req.params;
  const product = await productService.getProductById(pid);

  if (!product) {
    return res.status(404).render('productDetail', {
      title: 'Producto no encontrado',
      product: null
    });
  }

  res.render('productDetail', {
    title: product.title,
    product
  });
});

// El carrito solo lo ve su dueño (o un admin), identificado por la cookie JWT
router.get('/carts/:cid', authenticate('current'), async (req, res) => {
  const { cid } = req.params;
  const userCart = req.user.cart && String(req.user.cart._id || req.user.cart);

  if (req.user.role !== 'admin' && userCart !== cid) {
    return res.status(403).render('cartDetail', { title: 'Sin permisos', cart: null });
  }

  let cart = null;
  try {
    cart = await cartService.getCart(cid);
  } catch (error) {
    // se muestra como carrito no encontrado
  }

  if (!cart) {
    return res.status(404).render('cartDetail', {
      title: 'Carrito no encontrado',
      cart: null
    });
  }

  res.render('cartDetail', {
    title: 'Carrito',
    cart
  });
});

router.get('/realtimeproducts', (req, res) => {
  res.render('realTimeProducts', { title: 'Productos en Tiempo Real' });
});

router.get('/forgot-password', (req, res) => {
  res.render('forgotPassword', { title: 'Recuperar contraseña' });
});

router.get('/reset-password', (req, res) => {
  res.render('resetPassword', { title: 'Restablecer contraseña', token: req.query.token });
});

module.exports = router;

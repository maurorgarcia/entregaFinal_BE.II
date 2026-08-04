const express = require('express');
const router = express.Router();
const ProductManager = require('../managers/ProductManager');
const CartManager = require('../managers/CartManager');

const productManager = new ProductManager();
const cartManager = new CartManager();

router.get('/', async (req, res) => {
  res.redirect('/products');
});

router.get('/products', async (req, res) => {
  const { limit, page, sort, query } = req.query;
  const result = await productManager.getProducts({
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
  const product = await productManager.getProductById(pid);

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

router.get('/carts/:cid', async (req, res) => {
  const { cid } = req.params;
  const cart = await cartManager.getCartByIdPopulated(cid);

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

module.exports = router;

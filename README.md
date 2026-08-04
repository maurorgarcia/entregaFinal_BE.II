# Entrega Final Backend

Proyecto backend desarrollado con Node.js, Express, MongoDB, Mongoose, Handlebars y Socket.io.

La aplicacion permite gestionar productos y carritos, consultar productos con paginacion, filtros y ordenamiento, y visualizar productos/carritos desde vistas renderizadas con Handlebars.

## Tecnologias

- Node.js
- Express
- MongoDB Atlas o MongoDB local
- Mongoose
- Handlebars
- Socket.io
- Nodemon

## Instalacion

Clonar el repositorio e instalar dependencias:

```bash
npm install
```

El proyecto no incluye `node_modules`, por lo que siempre se deben instalar las dependencias despues de clonar.

## Configuracion de MongoDB

El proyecto usa MongoDB como sistema de persistencia principal.

Por defecto intenta conectarse a:

```txt
mongodb://127.0.0.1:27017/entrega_final_backend
```

Si se usa MongoDB Atlas, configurar la variable de entorno `MONGODB_URI`.

En PowerShell:

```powershell
$env:MONGODB_URI="mongodb+srv://usuario:password@cluster.mongodb.net/entrega_final_backend?appName=Cluster0"
```

Si la conexion `mongodb+srv` da problemas de DNS, tambien se puede usar la URI completa con los hosts del cluster provista por Atlas.

## Cargar Datos Iniciales

Para cargar en MongoDB los productos base incluidos en `src/data/products.json`:

```bash
npm run seed
```

El seed evita duplicar productos usando el campo `code`.

## Ejecucion

Modo desarrollo:

```bash
npm run dev
```

Modo produccion:

```bash
npm start
```

Servidor:

```txt
http://localhost:8080
```

## Vistas

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/products` | Lista productos con paginacion, filtros y ordenamiento |
| GET | `/products/:pid` | Muestra el detalle de un producto y permite agregarlo a un carrito |
| GET | `/carts/:cid` | Muestra los productos de un carrito especifico |
| GET | `/realtimeproducts` | Vista con Socket.io para agregar y eliminar productos en tiempo real |

Ejemplos:

```txt
http://localhost:8080/products
http://localhost:8080/products?limit=2&page=1&sort=asc
http://localhost:8080/products?query=Accesorios
```

## API Productos

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/products` | Obtiene productos con paginacion, filtros y ordenamiento |
| GET | `/api/products/:pid` | Obtiene un producto por id |
| POST | `/api/products` | Crea un producto |
| PUT | `/api/products/:pid` | Actualiza un producto |
| DELETE | `/api/products/:pid` | Elimina un producto |

### Query Params de `GET /api/products`

| Parametro | Descripcion | Default |
|-----------|-------------|---------|
| `limit` | Cantidad de productos por pagina | `10` |
| `page` | Pagina solicitada | `1` |
| `query` | Categoria o disponibilidad (`true` / `false`) | Sin filtro |
| `sort` | Orden por precio: `asc` o `desc` | Sin orden |

Ejemplos:

```txt
GET /api/products
GET /api/products?limit=2&page=1
GET /api/products?query=Accesorios
GET /api/products?query=true
GET /api/products?limit=2&page=1&sort=desc
```

Formato de respuesta:

```json
{
  "status": "success",
  "payload": [],
  "totalPages": 1,
  "prevPage": null,
  "nextPage": null,
  "page": 1,
  "hasPrevPage": false,
  "hasNextPage": false,
  "prevLink": null,
  "nextLink": null
}
```

Ejemplo para crear producto:

```json
{
  "title": "Monitor 24 pulgadas",
  "description": "Monitor Full HD",
  "code": "MON001",
  "price": 250,
  "stock": 8,
  "category": "Tecnologia",
  "thumbnails": []
}
```

## API Carritos

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/api/carts` | Crea un carrito |
| GET | `/api/carts/:cid` | Obtiene un carrito con productos populados |
| POST | `/api/carts/:cid/products/:pid` | Agrega un producto al carrito |
| DELETE | `/api/carts/:cid/products/:pid` | Elimina un producto especifico del carrito |
| PUT | `/api/carts/:cid` | Reemplaza todos los productos del carrito |
| PUT | `/api/carts/:cid/products/:pid` | Actualiza solo la cantidad de un producto |
| DELETE | `/api/carts/:cid` | Elimina todos los productos del carrito |

El modelo de carrito guarda solamente el id del producto, pero `GET /api/carts/:cid` utiliza `populate` para devolver los datos completos del producto.

### Reemplazar Productos del Carrito

```json
[
  {
    "product": "id-del-producto",
    "quantity": 2
  },
  {
    "product": "id-de-otro-producto",
    "quantity": 1
  }
]
```

### Actualizar Cantidad

```json
{
  "quantity": 4
}
```

## Pruebas Rapidas

Crear carrito:

```powershell
Invoke-RestMethod -Method Post "http://localhost:8080/api/carts"
```

Consultar productos:

```powershell
Invoke-RestMethod "http://localhost:8080/api/products?limit=2&page=1&sort=asc"
```

Agregar producto a carrito:

```powershell
Invoke-RestMethod -Method Post "http://localhost:8080/api/carts/CART_ID/products/PRODUCT_ID"
```

Actualizar cantidad:

```powershell
Invoke-RestMethod -Method Put "http://localhost:8080/api/carts/CART_ID/products/PRODUCT_ID" -ContentType "application/json" -Body '{"quantity":3}'
```

Vaciar carrito:

```powershell
Invoke-RestMethod -Method Delete "http://localhost:8080/api/carts/CART_ID"
```

## Estructura Principal

```txt
src/
  config/
    db.js
  managers/
    CartManager.js
    ProductManager.js
  models/
    Cart.js
    Product.js
  public/
    js/
      product-actions.js
      realtime.js
  routes/
    carts.router.js
    products.router.js
    views.router.js
  views/
    cartDetail.handlebars
    index.handlebars
    productDetail.handlebars
    realTimeProducts.handlebars
  app.js
scripts/
  seedProducts.js
```

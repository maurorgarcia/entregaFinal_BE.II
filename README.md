# Entrega Final - Backend II: CRUD de Usuarios y Autenticación JWT

Proyecto Backend desarrollado con **Node.js**, **Express**, **MongoDB**, **Mongoose**, **Passport.js** y **JWT**.

Incluye la gestión de usuarios con encriptación de contraseñas (`bcrypt`), autenticación con Passport (estrategias `register`, `login` y `jwt`), validación de sesión a través del endpoint `/api/sessions/current`, además del sistema de catálogo de productos y carritos de compra.

---

## Tecnologías Utilizadas

- **Node.js** & **Express**
- **MongoDB** & **Mongoose**
- **Passport.js** (passport-local, passport-jwt)
- **JSON Web Tokens (JWT)** & **Bcrypt**
- **Handlebars** & **Socket.io**
- **Cookie Parser** & **Dotenv**

---

## Instalación y Configuración

1. Clonar el repositorio e instalar las dependencias:

```bash
npm install
```

2. Configurar las variables de entorno en el archivo `.env`:

```env
PORT=8080
MONGODB_URI=mongodb://127.0.0.1:27017/entregafinal_be2
JWT_SECRET=coder_secret_2024
```

3. (Opcional) Cargar productos de prueba en la base de datos:

```bash
npm run seed
```

---

## Ejecución del Servidor

Modo desarrollo con Nodemon:

```bash
npm run dev
```

Modo producción:

```bash
npm start
```

El servidor estará escuchando en `http://localhost:8080`.

---

## Endpoints Principales

### Autenticación y Usuarios (`/api/sessions`)

| Método | Endpoint | Descripción | Requiere Auth |
|--------|----------|-------------|---------------|
| `POST` | `/api/sessions/register` | Registra un nuevo usuario con contraseña hasheada y le asigna un carrito propio | No |
| `POST` | `/api/sessions/login` | Autentica al usuario y devuelve un token JWT (además de setear cookie `jwt`) | No |
| `GET`  | `/api/sessions/current` | Valida el JWT y devuelve los datos del usuario logueado | Sí (JWT) |
| `GET`  | `/api/sessions/logout` | Limpia la cookie JWT | No |

### CRUD de Usuarios (`/api/users`)

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| `GET` | `/api/users` | Lista todos los usuarios | Admin |
| `GET` | `/api/users/:id` | Obtiene un usuario | El propio usuario o admin |
| `PUT` | `/api/users/:id` | Actualiza un usuario (re-hashea el password; solo admin puede cambiar `role`) | El propio usuario o admin |
| `DELETE` | `/api/users/:id` | Elimina un usuario | El propio usuario o admin |

La estrategia JWT consulta la base de datos en cada request: si el usuario del token fue eliminado, se devuelve `401`.

### Tests

```bash
npm test
```

Usa Jest + Supertest con MongoDB en memoria (no requiere una base local).

#### Ejemplo Body `POST /api/sessions/register`
```json
{
  "first_name": "Juan",
  "last_name": "Pérez",
  "email": "juan@example.com",
  "age": 28,
  "password": "miPasswordSegura123"
}
```

#### Ejemplo Body `POST /api/sessions/login`
```json
{
  "email": "juan@example.com",
  "password": "miPasswordSegura123"
}
```

#### Uso de `/api/sessions/current`
Enviar el header de autorización en la petición HTTP:
`Authorization: Bearer <TOKEN_JWT>` (o utilizar la cookie `jwt`).

---

### Productos (`/api/products`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET`  | `/api/products` | Lista de productos con paginación, filtros y ordenamiento |
| `GET`  | `/api/products/:pid` | Detalle de un producto por ID |
| `POST` | `/api/products` | Crear nuevo producto |
| `PUT`  | `/api/products/:pid` | Actualizar producto |
| `DELETE` | `/api/products/:pid` | Eliminar producto |

---

### Carritos (`/api/carts`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/carts` | Crea un carrito vacío |
| `GET`  | `/api/carts/:cid` | Obtiene un carrito con productos populados |
| `POST` | `/api/carts/:cid/products/:pid` | Agrega un producto al carrito |
| `DELETE` | `/api/carts/:cid/products/:pid` | Elimina un producto del carrito |
| `PUT`  | `/api/carts/:cid` | Actualiza la lista completa de productos del carrito |
| `PUT`  | `/api/carts/:cid/products/:pid` | Actualiza la cantidad de un producto específico |
| `DELETE` | `/api/carts/:cid` | Vacía el carrito |

---

## Estructura del Proyecto

```txt
src/
├── config/
│   ├── db.js
│   └── passport.config.js
├── managers/
│   ├── CartManager.js
│   ├── ProductManager.js
│   └── UserManager.js
├── middleware/
│   └── auth.middleware.js
├── models/
│   ├── Cart.js
│   ├── Product.js
│   └── User.js
├── routes/
│   ├── carts.router.js
│   ├── products.router.js
│   ├── sessions.router.js
│   └── views.router.js
├── views/
└── app.js
```

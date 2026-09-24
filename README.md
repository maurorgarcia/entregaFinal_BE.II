# Entrega Final - Backend II: Arquitectura Profesional para el Ecommerce

Servidor ecommerce con **Node.js**, **Express**, **MongoDB/Mongoose**, **Passport (JWT)** y **Nodemailer**. Esta entrega incorpora el patrón **Repository** sobre **DAOs**, **DTOs**, autorización por roles, recuperación de contraseña por mail y lógica de compra con **Tickets**.

---

## Arquitectura

```txt
Router  ->  Service  ->  Repository  ->  DAO  ->  Modelo (Mongoose)
(HTTP)      (negocio)    (dominio)       (BD)
```

```txt
src/
├── config/          config.js (variables de entorno), db.js, passport.config.js
├── dao/             UserDAO, ProductDAO, CartDAO, TicketDAO, PasswordResetDAO  (solo acceso a datos)
├── repositories/    UserRepository, ProductRepository, CartRepository, TicketRepository, PasswordResetRepository
├── services/        ProductService, CartService (compra), UserService, PasswordService, MailService
├── dto/             UserDTO
├── middleware/      auth.middleware.js (authenticate, authorize, ownsCart)
├── models/          User, Product, Cart, Ticket, PasswordReset
├── routes/          sessions, users, products, carts, views
├── utils/           errors.js
└── app.js
scripts/             seedProducts.js, createAdmin.js
tests/               auth.test.js, final.test.js
```

- **DAO**: único lugar que usa Mongoose. Sin lógica de negocio.
- **Repository**: interfaz de dominio sobre el DAO (validación de ids, formateo). Los services solo hablan con repositories.
- **Service**: reglas de negocio (compra, stock, recuperación de contraseña, hasheo, validaciones).
- **DTO**: `UserDTO` define qué datos del usuario se exponen en `/current`.

---

## Instalación y Configuración

```bash
npm install
```

Variables de entorno (archivo `.env`, incluido en el repo para la entrega):

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto del servidor (8080) |
| `BASE_URL` | URL base usada en los enlaces de los mails |
| `MONGODB_URI` | Conexión a MongoDB (si no hay Mongo local se usa uno en memoria) |
| `JWT_SECRET` | Secreto para firmar los JWT |
| `MAIL_SERVICE`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM` | Credenciales de mailing (Gmail con *contraseña de aplicación*). **Sin `MAIL_USER`/`MAIL_PASS` el mail se simula: el enlace se imprime en la consola del servidor.** |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Usuario que crea `npm run seed:admin` |

```bash
npm run seed        # productos de prueba
npm run seed:admin  # crea/promueve al administrador definido en .env
npm run dev         # desarrollo (nodemon)   |   npm start   # producción
npm test            # Jest + Supertest con MongoDB en memoria
```

---

## Roles y autorización

Las rutas protegidas usan `authenticate("current")` (estrategia Passport `current`, que valida el JWT y consulta al usuario en la base) seguido de `authorize(...roles)`.

| Acción | Rol permitido |
|--------|---------------|
| Crear / actualizar / eliminar productos (HTTP y sockets) | `admin` |
| Agregar/quitar productos, modificar y comprar el carrito | `user`, y solo sobre **su propio** carrito |
| Ver un carrito | su dueño o `admin` |
| Listar usuarios | `admin` |
| Ver/editar/eliminar un usuario | el propio usuario o `admin` (solo `admin` cambia roles) |

Sin token responde `401`; con rol o carrito incorrecto, `403`.

---

## Endpoints

### Sesiones (`/api/sessions`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/register` | Registra un usuario (password hasheado) y le crea un carrito |
| `POST` | `/login` | Devuelve un JWT (y cookie `jwt`) |
| `GET`  | `/current` | Devuelve un **UserDTO** del usuario logueado |
| `POST` | `/forgot-password` | Body `{ email }`. Envía el mail con el botón de recuperación |
| `POST` | `/reset-password` | Body `{ token, password }`. Cambia la contraseña |
| `GET`  | `/logout` | Limpia la cookie |

`GET /current` responde solo:

```json
{ "status": "success", "payload": { "id": "...", "first_name": "Juan", "last_name": "Pérez", "email": "juan@example.com", "age": 28, "role": "user", "cart": "..." } }
```

### Recuperación de contraseña

1. `POST /api/sessions/forgot-password` genera un token aleatorio (se guarda solo su hash SHA-256) y envía un mail con un botón que lleva a `/reset-password?token=...`. La respuesta es la misma exista o no el email.
2. El enlace **expira a la hora** (`PasswordReset.expiresAt`, con índice TTL de MongoDB).
3. `POST /api/sessions/reset-password` valida el token, **rechaza una contraseña igual a la anterior**, guarda la nueva y invalida el enlace.

Vistas: `/forgot-password` y `/reset-password`.

### Productos (`/api/products`)

| Método | Endpoint | Permiso |
|--------|----------|---------|
| `GET` | `/`, `/:pid` | Público (paginación, filtros y orden) |
| `POST` | `/` | Admin |
| `PUT` | `/:pid` | Admin |
| `DELETE` | `/:pid` | Admin |

### Carritos (`/api/carts`)

| Método | Endpoint | Permiso |
|--------|----------|---------|
| `POST` | `/` | Autenticado (crea un carrito vacío) |
| `GET` | `/:cid` | Dueño o admin |
| `POST` | `/:cid/products/:pid` | Usuario dueño del carrito |
| `PUT` | `/:cid` | Usuario dueño del carrito |
| `PUT` | `/:cid/products/:pid` | Usuario dueño del carrito |
| `DELETE` | `/:cid/products/:pid` | Usuario dueño del carrito |
| `DELETE` | `/:cid` | Usuario dueño del carrito (vacía) |
| `POST` | `/:cid/purchase` | Usuario dueño del carrito |

### Compra y Ticket

`POST /api/carts/:cid/purchase` recorre el carrito:

- Por cada producto **descuenta el stock de forma atómica** (`stock >= cantidad`), así dos compras simultáneas no pueden dejar stock negativo.
- Los productos **con stock** se compran; los que **no alcanzan** quedan en el carrito.
- Se genera un **Ticket** con `code` (único), `purchase_datetime`, `amount` (suma de los productos comprados), `purchaser` (email del usuario) y el detalle de ítems. También se envía por mail.
- Respuesta: `{ ticket, notPurchased: [ids] }`. Compra completa → `notPurchased` vacío. Si ningún producto tiene stock → `409` y no se crea ticket. Carrito vacío → `400`.

### Usuarios (`/api/users`)

CRUD con permisos descriptos arriba. El password se hashea en `UserService` y nunca se devuelve.

---

## Tests

`npm test` cubre registro/login, DTO de `/current`, CRUD de usuarios, autorización de productos y carritos por rol, compra completa/parcial/sin stock, y recuperación de contraseña (mail, expiración de 1 hora, contraseña repetida, token de un solo uso).

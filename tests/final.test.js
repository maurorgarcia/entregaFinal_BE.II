const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../src/app");
const User = require("../src/models/User");
const Product = require("../src/models/Product");
const Ticket = require("../src/models/Ticket");
const Cart = require("../src/models/Cart");
const PasswordReset = require("../src/models/PasswordReset");
const mailService = require("../src/services/MailService");

let mongoServer;
let sentMails;

const baseUser = { first_name: "Juan", last_name: "Perez", age: 28, password: "secreta123" };

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Promise.all([User, Product, Ticket, Cart, PasswordReset].map(model => model.deleteMany({})));
  sentMails = [];
  jest.spyOn(mailService, "sendPasswordReset").mockImplementation(async (to, name, link) => {
    sentMails.push({ to, link });
  });
  jest.spyOn(mailService, "sendPurchaseTicket").mockResolvedValue({});
});

const createUser = async (email, role = "user") => {
  const reg = await request(app).post("/api/sessions/register").send({ ...baseUser, email });
  if (role !== "user") await User.findByIdAndUpdate(reg.body.payload._id, { role });
  const login = await request(app).post("/api/sessions/login").send({ email, password: baseUser.password });
  return { user: reg.body.payload, token: login.body.token, cartId: String(reg.body.payload.cart) };
};

const auth = token => ({ Authorization: `Bearer ${token}` });

const productData = (overrides = {}) => ({
  title: "Mouse",
  description: "Mouse gamer",
  code: "MOU-1",
  price: 100,
  stock: 5,
  category: "perifericos",
  ...overrides
});

describe("GET /api/sessions/current (DTO)", () => {
  it("devuelve solo datos no sensibles", async () => {
    const { token } = await createUser("dto@example.com");
    const res = await request(app).get("/api/sessions/current").set(auth(token));
    expect(res.status).toBe(200);
    expect(Object.keys(res.body.payload).sort()).toEqual(
      ["age", "cart", "email", "first_name", "id", "last_name", "role"]
    );
    expect(res.body.payload.password).toBeUndefined();
    expect(res.body.payload.createdAt).toBeUndefined();
  });
});

describe("Autorizacion de productos (solo admin)", () => {
  it("un usuario comun no puede crear, actualizar ni eliminar", async () => {
    const admin = await createUser("admin@example.com", "admin");
    const created = await request(app).post("/api/products").set(auth(admin.token)).send(productData());
    const { token } = await createUser("user@example.com");

    const post = await request(app).post("/api/products").set(auth(token)).send(productData({ code: "X" }));
    const put = await request(app).put(`/api/products/${created.body.payload._id}`).set(auth(token)).send({ price: 1 });
    const del = await request(app).delete(`/api/products/${created.body.payload._id}`).set(auth(token));
    expect([post.status, put.status, del.status]).toEqual([403, 403, 403]);
  });

  it("sin token responde 401", async () => {
    const res = await request(app).post("/api/products").send(productData());
    expect(res.status).toBe(401);
  });

  it("el admin puede crear, actualizar y eliminar", async () => {
    const { token } = await createUser("admin@example.com", "admin");
    const created = await request(app).post("/api/products").set(auth(token)).send(productData());
    expect(created.status).toBe(201);
    const id = created.body.payload._id;

    const updated = await request(app).put(`/api/products/${id}`).set(auth(token)).send({ price: 250 });
    expect(updated.status).toBe(200);
    expect(updated.body.payload.price).toBe(250);

    const deleted = await request(app).delete(`/api/products/${id}`).set(auth(token));
    expect(deleted.status).toBe(200);
  });

  it("la lectura de productos es publica", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
  });
});

describe("Autorizacion de carritos (solo usuario, solo su carrito)", () => {
  let product;

  beforeEach(async () => {
    product = await Product.create(productData());
  });

  it("el usuario agrega productos a su carrito", async () => {
    const { token, cartId } = await createUser("u1@example.com");
    const res = await request(app).post(`/api/carts/${cartId}/products/${product._id}`).set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.payload.products[0].quantity).toBe(1);

    const again = await request(app).post(`/api/carts/${cartId}/products/${product._id}`).set(auth(token));
    expect(again.body.payload.products[0].quantity).toBe(2);
  });

  it("un admin no puede agregar productos al carrito", async () => {
    const { token, cartId } = await createUser("admin@example.com", "admin");
    const res = await request(app).post(`/api/carts/${cartId}/products/${product._id}`).set(auth(token));
    expect(res.status).toBe(403);
  });

  it("un usuario no puede tocar el carrito de otro", async () => {
    const a = await createUser("a@example.com");
    const b = await createUser("b@example.com");
    const res = await request(app).post(`/api/carts/${b.cartId}/products/${product._id}`).set(auth(a.token));
    expect(res.status).toBe(403);
  });

  it("sin token responde 401", async () => {
    const { cartId } = await createUser("u2@example.com");
    const res = await request(app).post(`/api/carts/${cartId}/products/${product._id}`);
    expect(res.status).toBe(401);
  });

  it("producto inexistente responde 404", async () => {
    const { token, cartId } = await createUser("u3@example.com");
    const res = await request(app)
      .post(`/api/carts/${cartId}/products/${new mongoose.Types.ObjectId()}`)
      .set(auth(token));
    expect(res.status).toBe(404);
  });
});

describe("POST /api/carts/:cid/purchase", () => {
  const addToCart = (token, cartId, productId, times = 1) =>
    (async () => {
      for (let i = 0; i < times; i++) {
        await request(app).post(`/api/carts/${cartId}/products/${productId}`).set(auth(token));
      }
    })();

  it("compra completa: genera ticket, descuenta stock y vacia el carrito", async () => {
    const p1 = await Product.create(productData({ code: "A", price: 100, stock: 5 }));
    const p2 = await Product.create(productData({ code: "B", price: 50, stock: 3 }));
    const { token, cartId } = await createUser("buyer@example.com");
    await addToCart(token, cartId, p1._id, 2);
    await addToCart(token, cartId, p2._id, 1);

    const res = await request(app).post(`/api/carts/${cartId}/purchase`).set(auth(token));
    expect(res.status).toBe(200);
    const { ticket, notPurchased } = res.body.payload;
    expect(ticket.amount).toBe(250);
    expect(ticket.purchaser).toBe("buyer@example.com");
    expect(ticket.code).toBeDefined();
    expect(ticket.purchase_datetime).toBeDefined();
    expect(notPurchased).toEqual([]);

    expect((await Product.findById(p1._id)).stock).toBe(3);
    expect((await Product.findById(p2._id)).stock).toBe(2);
    expect((await Cart.findById(cartId)).products).toHaveLength(0);
    expect(await Ticket.countDocuments()).toBe(1);
  });

  it("compra parcial: los productos sin stock quedan en el carrito", async () => {
    const ok = await Product.create(productData({ code: "OK", price: 100, stock: 5 }));
    const short = await Product.create(productData({ code: "SHORT", price: 10, stock: 1 }));
    const { token, cartId } = await createUser("partial@example.com");
    await addToCart(token, cartId, ok._id, 1);
    await addToCart(token, cartId, short._id, 3);

    const res = await request(app).post(`/api/carts/${cartId}/purchase`).set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.payload.ticket.amount).toBe(100);
    expect(res.body.payload.notPurchased).toEqual([String(short._id)]);

    expect((await Product.findById(short._id)).stock).toBe(1);
    const cart = await Cart.findById(cartId);
    expect(cart.products).toHaveLength(1);
    expect(String(cart.products[0].product)).toBe(String(short._id));
    expect(cart.products[0].quantity).toBe(3);
  });

  it("sin stock para nada: 409 y no genera ticket", async () => {
    const short = await Product.create(productData({ code: "S", stock: 1 }));
    const { token, cartId } = await createUser("none@example.com");
    await addToCart(token, cartId, short._id, 2);

    const res = await request(app).post(`/api/carts/${cartId}/purchase`).set(auth(token));
    expect(res.status).toBe(409);
    expect(await Ticket.countDocuments()).toBe(0);
  });

  it("carrito vacio: 400", async () => {
    const { token, cartId } = await createUser("empty@example.com");
    const res = await request(app).post(`/api/carts/${cartId}/purchase`).set(auth(token));
    expect(res.status).toBe(400);
  });

  it("no se puede comprar el carrito de otro ni siendo admin", async () => {
    const a = await createUser("a@example.com");
    const admin = await createUser("admin@example.com", "admin");
    expect((await request(app).post(`/api/carts/${a.cartId}/purchase`).set(auth(admin.token))).status).toBe(403);
    const b = await createUser("b@example.com");
    expect((await request(app).post(`/api/carts/${a.cartId}/purchase`).set(auth(b.token))).status).toBe(403);
  });
});

describe("Recuperacion de contraseña", () => {
  const email = "reset@example.com";
  const tokenFromLink = link => new URL(link).searchParams.get("token");

  const requestReset = async () => {
    await request(app).post("/api/sessions/forgot-password").send({ email });
    return tokenFromLink(sentMails[sentMails.length - 1].link);
  };

  beforeEach(() => createUser(email));

  it("envia el mail con el enlace y responde igual si el email no existe", async () => {
    const known = await request(app).post("/api/sessions/forgot-password").send({ email });
    const unknown = await request(app).post("/api/sessions/forgot-password").send({ email: "nadie@example.com" });
    expect(known.status).toBe(200);
    expect(unknown.body).toEqual(known.body);
    expect(sentMails).toHaveLength(1);
    expect(sentMails[0].to).toBe(email);
    expect(sentMails[0].link).toContain("/reset-password?token=");
  });

  it("permite cambiar la contraseña con el enlace y el token no se reutiliza", async () => {
    const token = await requestReset();
    const res = await request(app).post("/api/sessions/reset-password").send({ token, password: "nuevaClave1" });
    expect(res.status).toBe(200);

    const login = await request(app).post("/api/sessions/login").send({ email, password: "nuevaClave1" });
    expect(login.status).toBe(200);
    const oldLogin = await request(app).post("/api/sessions/login").send({ email, password: baseUser.password });
    expect(oldLogin.status).toBe(401);

    const reuse = await request(app).post("/api/sessions/reset-password").send({ token, password: "otraClave2" });
    expect(reuse.status).toBe(400);
  });

  it("rechaza usar la misma contraseña que ya tenia", async () => {
    const token = await requestReset();
    const res = await request(app).post("/api/sessions/reset-password").send({ token, password: baseUser.password });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/igual a la anterior/);
    // el enlace sigue siendo valido para una contraseña distinta
    const ok = await request(app).post("/api/sessions/reset-password").send({ token, password: "distinta123" });
    expect(ok.status).toBe(200);
  });

  it("el enlace expira despues de una hora", async () => {
    const token = await requestReset();
    const record = await PasswordReset.findOne();
    const remaining = record.expiresAt.getTime() - Date.now();
    expect(remaining).toBeGreaterThan(59 * 60 * 1000);
    expect(remaining).toBeLessThanOrEqual(60 * 60 * 1000);

    await PasswordReset.updateOne({ _id: record._id }, { expiresAt: new Date(Date.now() - 1000) });
    const res = await request(app).post("/api/sessions/reset-password").send({ token, password: "nuevaClave1" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/expiro/);
  });

  it("rechaza tokens inventados", async () => {
    const res = await request(app).post("/api/sessions/reset-password").send({ token: "falso", password: "nuevaClave1" });
    expect(res.status).toBe(400);
  });
});

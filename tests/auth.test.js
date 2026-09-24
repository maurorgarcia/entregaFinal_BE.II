const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../src/app");
const User = require("../src/models/User");

let mongoServer;
const userData = {
  first_name: "Juan",
  last_name: "Perez",
  email: "juan@example.com",
  age: 28,
  password: "secreta123"
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

const registerAndLogin = async (data = userData) => {
  const reg = await request(app).post("/api/sessions/register").send(data);
  const login = await request(app)
    .post("/api/sessions/login")
    .send({ email: data.email, password: data.password });
  return { user: reg.body.payload, token: login.body.token };
};

describe("POST /api/sessions/register", () => {
  it("registra un usuario con password hasheado y sin exponerlo", async () => {
    const res = await request(app).post("/api/sessions/register").send(userData);
    expect(res.status).toBe(201);
    expect(res.body.payload.password).toBeUndefined();
    expect(res.body.payload.role).toBe("user");
    const stored = await User.findOne({ email: userData.email }).select("+password");
    expect(stored.password).not.toBe(userData.password);
  });

  it("rechaza un email ya registrado", async () => {
    await request(app).post("/api/sessions/register").send(userData);
    const res = await request(app).post("/api/sessions/register").send(userData);
    expect(res.status).toBe(400);
  });
});

describe("POST /api/sessions/login", () => {
  beforeEach(() => request(app).post("/api/sessions/register").send(userData));

  it("devuelve un token con credenciales correctas", async () => {
    const res = await request(app)
      .post("/api/sessions/login")
      .send({ email: userData.email, password: userData.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("devuelve 401 con password incorrecto", async () => {
    const res = await request(app)
      .post("/api/sessions/login")
      .send({ email: userData.email, password: "mala" });
    expect(res.status).toBe(401);
  });

  it("devuelve 401 con usuario inexistente", async () => {
    const res = await request(app)
      .post("/api/sessions/login")
      .send({ email: "nadie@example.com", password: "x" });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/sessions/current", () => {
  it("devuelve el usuario logueado sin password", async () => {
    const { token } = await registerAndLogin();
    const res = await request(app).get("/api/sessions/current").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.payload.email).toBe(userData.email);
    expect(res.body.payload.password).toBeUndefined();
  });

  it("devuelve 401 sin token", async () => {
    const res = await request(app).get("/api/sessions/current");
    expect(res.status).toBe(401);
  });

  it("devuelve 401 con token invalido", async () => {
    const res = await request(app).get("/api/sessions/current").set("Authorization", "Bearer invalido");
    expect(res.status).toBe(401);
  });

  it("devuelve 401 si el usuario del token fue borrado", async () => {
    const { token } = await registerAndLogin();
    await User.deleteMany({});
    const res = await request(app).get("/api/sessions/current").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});

describe("CRUD /api/users", () => {
  it("exige autenticacion", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(401);
  });

  it("un usuario comun no puede listar usuarios", async () => {
    const { token } = await registerAndLogin();
    const res = await request(app).get("/api/users").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("un admin puede listar usuarios", async () => {
    const { user, token } = await registerAndLogin();
    await User.findByIdAndUpdate(user._id, { role: "admin" });
    const res = await request(app).get("/api/users").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.payload).toHaveLength(1);
  });

  it("el usuario puede ver y actualizar su propio perfil", async () => {
    const { user, token } = await registerAndLogin();
    const get = await request(app).get(`/api/users/${user._id}`).set("Authorization", `Bearer ${token}`);
    expect(get.status).toBe(200);
    const put = await request(app)
      .put(`/api/users/${user._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ first_name: "Pedro", password: "nueva123" });
    expect(put.status).toBe(200);
    expect(put.body.payload.first_name).toBe("Pedro");
    const relogin = await request(app)
      .post("/api/sessions/login")
      .send({ email: userData.email, password: "nueva123" });
    expect(relogin.status).toBe(200);
  });

  it("un usuario comun no puede cambiarse el rol ni tocar a otro", async () => {
    const { user, token } = await registerAndLogin();
    const other = await request(app)
      .post("/api/sessions/register")
      .send({ ...userData, email: "otro@example.com" });
    const role = await request(app)
      .put(`/api/users/${user._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "admin" });
    expect(role.status).toBe(403);
    const del = await request(app)
      .delete(`/api/users/${other.body.payload._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(del.status).toBe(403);
  });

  it("el usuario puede eliminarse y su token deja de valer", async () => {
    const { user, token } = await registerAndLogin();
    const del = await request(app).delete(`/api/users/${user._id}`).set("Authorization", `Bearer ${token}`);
    expect(del.status).toBe(200);
    const current = await request(app).get("/api/sessions/current").set("Authorization", `Bearer ${token}`);
    expect(current.status).toBe(401);
  });
});

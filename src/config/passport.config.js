const passport = require("passport");
const local = require("passport-local");
const jwt = require("passport-jwt");
const bcrypt = require("bcrypt");

const UserManager = require("../managers/UserManager");
const CartManager = require("../managers/CartManager");

const LocalStrategy = local.Strategy;
const JWTStrategy = jwt.Strategy;
const ExtractJWT = jwt.ExtractJwt;

const userManager = new UserManager();
const cartManager = new CartManager();

const cookieExtractor = (req) => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies["jwt"];
  }
  return token;
};

const initializePassport = () => {
  // Estrategia de Registro
  passport.use(
    "register",
    new LocalStrategy(
      { passReqToCallback: true, usernameField: "email" },
      async (req, username, password, done) => {
        const { first_name, last_name, email, age } = req.body;
        try {
          const userExists = await userManager.getUserByEmail(username);
          if (userExists) {
            return done(null, false, { message: "El usuario ya existe" });
          }

          // Creamos un carrito vacío para el nuevo usuario
          const newCart = await cartManager.createCart();

          const newUser = {
            first_name,
            last_name,
            email,
            age,
            password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
            cart: newCart._id
          };

          const result = await userManager.createUser(newUser);
          return done(null, result);
        } catch (error) {
          return done("Error al registrar el usuario: " + error);
        }
      }
    )
  );

  // Estrategia de Login
  passport.use(
    "login",
    new LocalStrategy(
      { usernameField: "email" },
      async (username, password, done) => {
        try {
          const user = await userManager.getUserByEmail(username);
          if (!user) {
            return done(null, false, { message: "Usuario no encontrado" });
          }

          if (!user.isValidPassword(password)) {
            return done(null, false, { message: "Contraseña incorrecta" });
          }

          // Convertimos a objeto y quitamos el password antes de devolverlo
          const userObj = user.toObject();
          delete userObj.password;

          return done(null, userObj);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Estrategia JWT (Current)
  passport.use(
    "jwt",
    new JWTStrategy(
      {
        jwtFromRequest: ExtractJWT.fromExtractors([
          ExtractJWT.fromAuthHeaderAsBearerToken(),
          cookieExtractor,
        ]),
        secretOrKey: process.env.JWT_SECRET || "coder_secret_2024",
      },
      async (jwt_payload, done) => {
        try {
          // Verificamos que el usuario del token siga existiendo en la base de datos
          const user = await userManager.getUserById(jwt_payload._id);
          if (!user) {
            return done(null, false, { message: "El usuario del token ya no existe" });
          }
          return done(null, user.toObject());
        } catch (error) {
          return done(error);
        }
      }
    )
  );
};

module.exports = initializePassport;

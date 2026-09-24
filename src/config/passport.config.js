const passport = require("passport");
const local = require("passport-local");
const jwt = require("passport-jwt");

const config = require("./config");
const { userService } = require("../services");
const { userRepository } = require("../repositories");

const LocalStrategy = local.Strategy;
const JWTStrategy = jwt.Strategy;
const ExtractJWT = jwt.ExtractJwt;

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
        const { first_name, last_name, age } = req.body;
        try {
          const user = await userService.register({ first_name, last_name, email: username, age, password });
          return done(null, user);
        } catch (error) {
          if (error.status) return done(null, false, { message: error.message });
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
          const { user, message } = await userService.validateCredentials(username, password);
          if (!user) return done(null, false, { message });
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.use(
    "current",
    new JWTStrategy(
      {
        jwtFromRequest: ExtractJWT.fromExtractors([
          ExtractJWT.fromAuthHeaderAsBearerToken(),
          cookieExtractor,
        ]),
        secretOrKey: config.jwtSecret,
      },
      async (jwt_payload, done) => {
        try {
          // Verificamos que el usuario del token siga existiendo en la base de datos
          const user = await userRepository.getUserById(jwt_payload._id);
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

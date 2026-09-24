const passport = require("passport");

const authenticate = (strategy) => {
  return async (req, res, next) => {
    passport.authenticate(strategy, { session: false }, (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({
          status: "error",
          message: info ? info.message : "No autenticado"
        });
      }
      req.user = user;
      next();
    })(req, res, next);
  };
};

// Restringe el acceso a los roles indicados (debe usarse despues de authenticate)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ status: "error", message: "No tenes permisos para realizar esta accion" });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorize
};

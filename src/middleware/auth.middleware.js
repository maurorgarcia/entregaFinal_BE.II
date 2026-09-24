const passport = require("passport");

const authenticate = (strategy = "current") => {
  return (req, res, next) => {
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

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ status: "error", message: "No tenes permisos para realizar esta accion" });
    }
    next();
  };
};

const ownsCart = (req, res, next) => {
  const userCart = req.user.cart && (req.user.cart._id || req.user.cart);
  if (!userCart || String(userCart) !== String(req.params.cid)) {
    return res.status(403).json({ status: "error", message: "Solo podes operar sobre tu propio carrito" });
  }
  next();
};

module.exports = {
  authenticate,
  authorize,
  ownsCart
};

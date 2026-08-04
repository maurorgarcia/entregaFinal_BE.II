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

module.exports = {
  authenticate
};

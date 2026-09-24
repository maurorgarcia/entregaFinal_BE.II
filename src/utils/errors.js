// Error de negocio con codigo HTTP asociado; los routers lo traducen a la respuesta
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const sendError = (res, error) => {
  const status = error.status || 500;
  const message = error.status ? error.message : "Error interno del servidor";
  if (!error.status) console.error(error);
  res.status(status).json({ status: "error", message });
};

module.exports = { HttpError, sendError };

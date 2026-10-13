// Centralised error handling so controllers can just `next(err)` instead of
// each writing its own try/catch response shape.
function notFound(req, res) {
  res.status(404).json({ success: false, error: `No route for ${req.method} ${req.originalUrl}` })
}

function errorHandler(err, req, res, _next) {
  console.error(err)
  const status = err.status ?? 500
  res.status(status).json({ success: false, error: err.message ?? 'Something went wrong on the server.' })
}

module.exports = { notFound, errorHandler }

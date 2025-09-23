
module.exports = (err, req, res, next) => {
  // log error detail di server (jangan kirim stack ke client di production)
  console.error(err && err.stack ? err.stack : err);

  const status = err && err.status ? err.status : 500;
  const message = err && err.message ? err.message : 'internal server error';

  res.status(status).json({
    success: false,
    message: message,
    // hanya tampilkan error detail kalau NODE_ENV=development
    error: process.env.NODE_ENV === 'development' ? (err && err.message ? err.message : null) : undefined
  });
};

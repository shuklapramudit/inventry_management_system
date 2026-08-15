// =====================================================
// NOT FOUND MIDDLEWARE
// =====================================================

export const notFound = (
  req,
  res,
  next
) => {
  const error = new Error(
    `Route not found: ${req.method} ${req.originalUrl}`
  );

  res.status(404);

  next(error);
};


// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

export const errorHandler = (
  err,
  req,
  res,
  next
) => {
  console.error(
    "===================================="
  );

  console.error(
    "SERVER ERROR:"
  );

  console.error(
    err.stack || err.message
  );

  console.error(
    "===================================="
  );

  const statusCode =
    res.statusCode &&
    res.statusCode !== 200
      ? res.statusCode
      : 500;

  return res.status(statusCode).json({
    success: false,

    message:
      err.message ||
      "Internal Server Error",

    ...(process.env.NODE_ENV ===
      "development" && {
      stack: err.stack,
    }),
  });
};
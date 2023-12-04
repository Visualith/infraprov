import { ErrorRequestHandler } from 'express';

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    // Handle errors thrown by express-jwt middleware
    return res.status(401).send({ message: err.message });
  }
  // You can add more error types based on your application needs

  // If you don't recognize the error, pass it through to the default Express error handler
  next(err);
};

export default errorHandler;

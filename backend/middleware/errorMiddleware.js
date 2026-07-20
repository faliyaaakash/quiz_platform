const errorMiddleware = (err, _req, res, _next) => {
    const status = err.status || 500;
    const message = err.message || 'Something went wrong';
    // In production, we don't want to leak sensitive error details
    const response = {
        status: 'error',
        message: process.env.NODE_ENV === 'production' && status === 500 ? 'Internal Server Error' : message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    };
    res.status(status).json(response);
};
export default errorMiddleware;

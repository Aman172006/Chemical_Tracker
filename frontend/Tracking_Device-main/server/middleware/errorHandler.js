export const errorHandler = (err, req, res, next) => {
    console.error(`[SERVER-ERROR] ${err.stack}`);

    const status = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(status).json({
        error: true,
        message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

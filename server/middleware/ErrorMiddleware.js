const errorHandler = (error, request, response, next) => {
    console.error(error.stack);

    const statusCode = error.status || 500;
    const message = error.message || "Internal Server Error";

        if (request.headers.accept && request.headers.accept.includes("application/json")) {
        return response.status(statusCode).json({ error: message });
    }

    
    response.status(statusCode).render("error", { statusCode, message });
};

export default errorHandler;

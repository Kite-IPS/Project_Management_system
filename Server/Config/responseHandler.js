// Utility functions for standardized API responses

export const successResponse = (res, message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

export const errorResponse = (res, message, error = null, statusCode = 500) => {
  const response = {
    success: false,
    message
  };

  if (error) {
    response.error = error.message || error;
  }

  return res.status(statusCode).json(response);
};

export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error('Async error:', error);
      return errorResponse(res, 'Internal server error', error);
    });
  };
};
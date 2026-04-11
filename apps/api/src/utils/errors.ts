// Custom error classes for better error handling

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(404, message);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(429, message);
  }
}

// Error response formatter
export function formatErrorResponse(err: Error, isProduction: boolean): { error: string; message: string; stack?: string } {
  // In production, don't expose internal error details
  if (isProduction) {
    return {
      error: 'Internal Server Error',
      message: 'An unexpected error occurred. Please try again later.'
    };
  }
  
  // In development, include more details for debugging
  return {
    error: err.name || 'Error',
    message: err.message,
    stack: err.stack
  };
}

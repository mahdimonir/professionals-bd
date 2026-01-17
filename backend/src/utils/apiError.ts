export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly data?: any;

  constructor(
    statusCode: number,
    message: string,
    isOperational: boolean = true,
    data?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.data = data;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string = "Bad request", data?: any) {
    return new ApiError(400, message, true, data);
  }

  static unauthorized(message: string = "Unauthorized", data?: any) {
    return new ApiError(401, message, true, data);
  }

  static forbidden(message: string = "Forbidden", data?: any) {
    return new ApiError(403, message, true, data);
  }

  static notFound(message: string = "Resource not found", data?: any) {
    return new ApiError(404, message, true, data);
  }

  static conflict(message: string = "Conflict", data?: any) {
    return new ApiError(409, message, true, data);
  }

  static tooManyRequests(message: string = "Too many requests", data?: any) {
    return new ApiError(429, message, true, data);
  }

  static internal(message: string = "Internal server error") {
    return new ApiError(500, message, false);
  }

  static paymentFailed(message: string = "Payment failed") {
    return new ApiError(402, message, true);
  }
}
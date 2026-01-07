export class ApiResponse<T = any> {
  public readonly success: boolean = true;
  public readonly statusCode: number;
  public readonly message: string;
  public readonly data: T | null;
  public readonly meta?: any;

  constructor(
    statusCode: number,
    data: T | null,
    message: string = "Success",
    meta?: any
  ) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.meta = meta;
  }

  static success<T>(
    data: T,
    message: string = "Success",
    meta?: any
  ): ApiResponse<T> {
    return new ApiResponse(200, data, message, meta);
  }

  static created<T>(
    data: T,
    message: string = "Resource created successfully"
  ): ApiResponse<T> {
    return new ApiResponse(201, data, message);
  }

  static accepted<T>(
    data: T | null = null,
    message: string = "Request accepted"
  ): ApiResponse<T> {
    return new ApiResponse(202, data, message);
  }

  static noContent(message: string = "No content"): ApiResponse<null> {
    return new ApiResponse(204, null, message);
  }
}
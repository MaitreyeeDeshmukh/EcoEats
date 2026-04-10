/**
 * Base class for HTTP errors with status codes.
 * Extends native Error with a statusCode property for HTTP responses.
 */
export class HttpError extends Error {
	readonly statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.name = this.constructor.name;
		this.statusCode = statusCode;
	}
}

/**
 * Error for 404 Not Found responses.
 * Thrown when a requested resource does not exist.
 */
export class NotFoundError extends HttpError {
	constructor(message = "Not found") {
		super(message, 404);
	}
}

/**
 * Error for 409 Conflict responses.
 * Thrown when a request conflicts with the current state of the resource
 * (e.g., duplicate claims, inactive listings).
 */
export class ConflictError extends HttpError {
	constructor(message = "Conflict") {
		super(message, 409);
	}
}

/**
 * Error for 400 Bad Request responses.
 * Thrown when request validation fails or input is invalid
 * (e.g., insufficient quantity, invalid parameters).
 */
export class ValidationError extends HttpError {
	constructor(message = "Validation failed") {
		super(message, 400);
	}
}

/**
 * Error for 401 Unauthorized responses.
 * Thrown when authentication is required but missing or invalid.
 */
export class UnauthorizedError extends HttpError {
	constructor(message = "Unauthorized") {
		super(message, 401);
	}
}

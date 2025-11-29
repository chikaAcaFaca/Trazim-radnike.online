import { describe, it, expect } from 'vitest';
import { ApiError } from '../utils/ApiError.js';

describe('ApiError', () => {
  describe('constructor', () => {
    it('should create error with status code and message', () => {
      const error = new ApiError(400, 'Bad Request');

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Bad Request');
      expect(error.isOperational).toBe(true);
    });

    it('should allow setting isOperational to false', () => {
      const error = new ApiError(500, 'Server Error', false);

      expect(error.isOperational).toBe(false);
    });

    it('should be instance of Error', () => {
      const error = new ApiError(400, 'Test');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
    });

    it('should have stack trace', () => {
      const error = new ApiError(400, 'Test');

      expect(error.stack).toBeDefined();
    });
  });

  describe('static badRequest', () => {
    it('should create 400 error with default message', () => {
      const error = ApiError.badRequest();

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Bad Request');
    });

    it('should create 400 error with custom message', () => {
      const error = ApiError.badRequest('Invalid input');

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid input');
    });
  });

  describe('static unauthorized', () => {
    it('should create 401 error with default message', () => {
      const error = ApiError.unauthorized();

      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Unauthorized');
    });

    it('should create 401 error with custom message', () => {
      const error = ApiError.unauthorized('Invalid token');

      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Invalid token');
    });
  });

  describe('static forbidden', () => {
    it('should create 403 error with default message', () => {
      const error = ApiError.forbidden();

      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Forbidden');
    });

    it('should create 403 error with custom message', () => {
      const error = ApiError.forbidden('Access denied');

      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Access denied');
    });
  });

  describe('static notFound', () => {
    it('should create 404 error with default message', () => {
      const error = ApiError.notFound();

      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Not Found');
    });

    it('should create 404 error with custom message', () => {
      const error = ApiError.notFound('User not found');

      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('User not found');
    });
  });

  describe('static conflict', () => {
    it('should create 409 error with default message', () => {
      const error = ApiError.conflict();

      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Conflict');
    });

    it('should create 409 error with custom message', () => {
      const error = ApiError.conflict('Email already exists');

      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Email already exists');
    });
  });

  describe('static tooManyRequests', () => {
    it('should create 429 error with default message', () => {
      const error = ApiError.tooManyRequests();

      expect(error.statusCode).toBe(429);
      expect(error.message).toBe('Too Many Requests');
    });

    it('should create 429 error with custom message', () => {
      const error = ApiError.tooManyRequests('Rate limit exceeded');

      expect(error.statusCode).toBe(429);
      expect(error.message).toBe('Rate limit exceeded');
    });
  });

  describe('static internal', () => {
    it('should create 500 error with default message', () => {
      const error = ApiError.internal();

      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Internal Server Error');
    });

    it('should create 500 error with isOperational false', () => {
      const error = ApiError.internal('Database connection failed');

      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(false);
    });
  });
});

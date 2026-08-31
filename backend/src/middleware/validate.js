import { ZodError } from 'zod';
import ApiError from '../utils/ApiError.js';

/**
 * Validates request data against a Zod schema.
 * Source can be 'body', 'query', 'params' or a combination.
 *
 * Usage: validate({ body: studentCreateSchema })
 */
const validate = (schemas) => {
  if (!schemas || typeof schemas !== 'object') {
    throw new Error('validate() requires a schema object.');
  }

  return (req, res, next) => {
    try {
      const keys = ['body', 'query', 'params'];
      for (const key of keys) {
        const schema = schemas[key];
        if (!schema) continue;
        const result = schema.parse(req[key]);
        req[key] = result;
      }
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(ApiError.badRequest('Validation failed.', issues));
      }
      return next(error);
    }
  };
};

export default validate;

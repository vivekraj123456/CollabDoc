/**
 * Request validation middleware using express-validator
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ValidationError } from '../../utils/errors';

/**
 * Validates request based on provided validation chain
 * Throws ValidationError if validation fails
 */
export function validate(validations: ValidationChain[]) {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        // Run all validations
        await Promise.all(validations.map((validation) => validation.run(req)));

        const errors = validationResult(req);

        if (errors.isEmpty()) {
            return next();
        }

        const formattedErrors = errors.array().map((error) => ({
            field: (error as any).path || (error as any).param || 'unknown',
            message: error.msg,
        }));

        next(new ValidationError(formattedErrors));
    };
}

export default validate;

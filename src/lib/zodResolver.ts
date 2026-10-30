import type { Resolver, FieldValues, FieldErrors, ResolverOptions } from 'react-hook-form';
import { toNestErrors } from '@hookform/resolvers';
import type { z } from 'zod';

/**
 * Universal Zod Resolver compatible with Zod v4+ and react-hook-form.
 * 
 * Addresses the breaking change where Zod v4 replaced `err.errors` with `err.issues`,
 * which causes @hookform/resolvers/zod to throw unhandled ZodErrors instead of mapping field validation errors.
 */
export function zodResolver<T extends z.ZodType<FieldValues, any, any>>(
  schema: T
): Resolver<z.infer<T>> {
  return async (values, _context, options) => {
    const result = await schema.safeParseAsync(values);

    if (result.success) {
      return {
        values: result.data,
        errors: {},
      };
    }

    const flatErrors: Record<string, { type: string; message: string }> = {};

    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      if (!flatErrors[path]) {
        flatErrors[path] = {
          type: issue.code,
          
          message: issue.message,
        };
      }
    }

    return {
      values: {},
      errors: toNestErrors(flatErrors, options as unknown as ResolverOptions<FieldValues>) as FieldErrors<z.infer<T>>,
    };
  };
}

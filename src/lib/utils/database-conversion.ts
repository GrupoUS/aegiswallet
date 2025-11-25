/**
 * Database conversion utilities for AegisWallet
 * Handles snake_case to camelCase conversion for database fields
 * Ensures type safety between database schema and application interfaces
 */

export type SnakeCaseToCamelCase<S extends string> = S extends `${infer P1}_${infer P2}${infer P3}`
  ? `${P1}${Capitalize<SnakeCaseToCamelCase<`${P2}${P3}`>>}`
  : S;

export type CamelCaseToSnakeCase<S extends string> = S extends `${infer P1}${infer P2}`
  ? P2 extends Capitalize<P2>
    ? `${P1}_${Lowercase<P2>}`
    : `${P1}${CamelCaseToSnakeCase<P2>}`
  : S;

/**
 * Converts snake_case database field names to camelCase
 */
export function snakeToCamel<T extends Record<string, any>>(obj: T): { [K in keyof T as SnakeCaseToCamelCase<string & K>]: T[K] } {
  const result = {} as any;

  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }

  return result;
}

/**
 * Converts camelCase field names to snake_case for database operations
 */
export function camelToSnake<T extends Record<string, any>>(obj: T): { [K in keyof T as CamelCaseToSnakeCase<string & K>]: T[K] } {
  const result = {} as any;

  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = value;
  }

  return result;
}

/**
 * Deep conversion of nested objects from snake_case to camelCase
 */
export function deepSnakeToCamel<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(deepSnakeToCamel) as T;
  }

  if (typeof obj === 'object') {
    const result = {} as any;

    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = deepSnakeToCamel(value);
    }

    return result;
  }

  return obj;
}

/**
 * Deep conversion of nested objects from camelCase to snake_case
 */
export function deepCamelToSnake<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(deepCamelToSnake) as T;
  }

  if (typeof obj === 'object') {
    const result = {} as any;

    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = deepCamelToSnake(value);
    }

    return result;
  }

  return obj;
}

/**
 * Type-safe conversion for database rows to application interfaces
 */
export function convertDatabaseRow<T extends Record<string, any>>(row: T): { [K in keyof T as SnakeCaseToCamelCase<string & K>]: T[K] } {
  return snakeToCamel(row);
}

/**
 * Type-safe conversion for application data to database format
 */
export function convertToDatabaseRow<T extends Record<string, any>>(data: T): { [K in keyof T as CamelCaseToSnakeCase<string & K>]: T[K] } {
  return camelToSnake(data);
}
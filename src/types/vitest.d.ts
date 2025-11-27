/* eslint-disable @typescript-eslint/no-empty-object-type */
import 'vitest';

declare module 'vitest' {
  // biome-ignore lint/suspicious/noExplicitAny: Required for vitest Assertion interface compatibility
  interface Assertion<T = any> {
    toBeValidBRL(): T;
    toBeValidCPF(): T;
    toBeValidPIXKey(): T;
  }

  interface AsymmetricMatchersContaining {
    // biome-ignore lint/suspicious/noExplicitAny: Required for vitest interface compatibility
    toBeValidBRL(): any;
    // biome-ignore lint/suspicious/noExplicitAny: Required for vitest interface compatibility
    toBeValidCPF(): any;
    // biome-ignore lint/suspicious/noExplicitAny: Required for vitest interface compatibility
    toBeValidPIXKey(): any;
  }
}

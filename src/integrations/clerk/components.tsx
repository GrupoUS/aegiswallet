/**
 * Clerk Stub Components
 *
 * Stub implementations for Clerk components.
 * NOTE: Clerk integration is currently disabled - using Supabase auth instead.
 *
 * These stubs always render as 'signed out' state:
 * - SignedIn: returns null (user is not signed in)
 * - SignedOut: renders children (user is signed out)
 * - Protect: returns null (not authenticated)
 * - SignInButton/SignOutButton/SignUpButton: renders children (no-op buttons)
 *
 * @example
 * ```tsx
 * // Usage - these components behave as if user is always signed out
 * <SignedIn>This will never render</SignedIn>
 * <SignedOut>This will always render</SignedOut>
 * ```
 */

import type { ReactNode } from 'react';

/**
 * Stub: Always returns null (user is never authenticated in stub mode)
 */
export function Protect(_props: { children: ReactNode }) {
	return null;
}

/**
 * Stub: Returns null (no redirect functionality)
 */
export function RedirectToSignIn() {
	return null;
}

/**
 * Stub: Returns null (no redirect functionality)
 */
export function RedirectToSignUp() {
	return null;
}

/**
 * Stub: Always returns null (user is never signed in)
 */
export function SignedIn(_props: { children: ReactNode }) {
	return null;
}

/**
 * Stub: Always renders children (user is always signed out)
 */
export function SignedOut({ children }: { children: ReactNode }) {
	return <>{children}</>;
}

/**
 * Stub: Returns null (no sign-in form)
 */
export function SignIn() {
	return null;
}

/**
 * Stub: Renders children as a no-op button wrapper
 */
export function SignInButton({ children }: { children: ReactNode }) {
	return <>{children}</>;
}

/**
 * Stub: Renders children as a no-op button wrapper
 */
export function SignOutButton({ children }: { children: ReactNode }) {
	return <>{children}</>;
}

/**
 * Stub: Returns null (no sign-up form)
 */
export function SignUp() {
	return null;
}

/**
 * Stub: Renders children as a no-op button wrapper
 */
export function SignUpButton({ children }: { children: ReactNode }) {
	return <>{children}</>;
}

/**
 * Stub: Returns null (no user button)
 */
export function UserButton() {
	return null;
}

/**
 * Stub: Returns null (no user profile)
 */
export function UserProfile() {
	return null;
}

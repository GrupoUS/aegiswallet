/**
 * Clerk Stub Components
 *
 * Stub implementations for Clerk components
 * NOTE: Clerk integration is currently disabled - using Supabase auth instead
 */

import type { ReactNode } from 'react';

export function Protect(_props: { children: ReactNode }) {
	return null;
}

export function RedirectToSignIn() {
	return null;
}

export function RedirectToSignUp() {
	return null;
}

export function SignedIn(_props: { children: ReactNode }) {
	return null;
}

export function SignedOut({ children }: { children: ReactNode }) {
	return <>{children}</>;
}

export function SignIn() {
	return null;
}

export function SignInButton({ children }: { children: ReactNode }) {
	return <>{children}</>;
}

export function SignOutButton({ children }: { children: ReactNode }) {
	return <>{children}</>;
}

export function SignUp() {
	return null;
}

export function SignUpButton({ children }: { children: ReactNode }) {
	return <>{children}</>;
}

export function UserButton() {
	return null;
}

export function UserProfile() {
	return null;
}

import { ClerkProvider } from '@clerk/nextjs';
import type { ReactNode } from 'react';

// Clerk is scoped to this subtree only — the customer-facing app (app/layout.tsx
// and everything below it) never imports or references Clerk. The root layout
// already provides the html/body shell and dark theme, so this just adds Clerk.
export default function AdminLayout({ children }: { children: ReactNode }) {
	return <ClerkProvider>{children}</ClerkProvider>;
}

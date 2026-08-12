import './globals.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
	title: 'Flux Finance',
	description:
		'Um livro de obras e rastreador de despesas para finanças de canteiros de obras.',
	manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
	viewportFit: 'contain',
	userScalable: false,
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
	minimumScale: 1,
	themeColor: '#0f172a',
	// themeColor: '#1c1b19',
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang='en'>
			<body className='min-h-screen bg-slate-950 text-slate-100 antialiased'>
				{children}
			</body>
		</html>
	);
}

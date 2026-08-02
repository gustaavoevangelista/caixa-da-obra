import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'Flux Finance',
		short_name: 'Flux Finance',
		description:
			'Um livro de obras e rastreador de despesas para finanças de canteiros de obras.',
		start_url: '/',
		scope: '/',
		display: 'standalone',
		background_color: '#0f172a',
		theme_color: '#0f172a',
		orientation: 'portrait',
		categories: ['finance', 'productivity'],
		icons: [
			{
				src: 'icons/logo.png',
				sizes: 'any',
				type: 'image/x-icon',
			}
		],
	};
}

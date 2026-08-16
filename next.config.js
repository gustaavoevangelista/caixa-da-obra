/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	experimental: {
		serverActions: {
			allowedOrigins: [
				'localhost:3000',
				'*.euw.devtunnels.ms',
				'https://caixa-da-obra.vercel.app/',
			],
		},
	},
};

module.exports = nextConfig;

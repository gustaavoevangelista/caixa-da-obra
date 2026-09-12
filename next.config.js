/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	experimental: {
		serverActions: {
			allowedOrigins: [
				'localhost:3000',
				'*.euw.devtunnels.ms',
				'https://caixa-da-obra.vercel.app/',
				'192.168.0.102',
			],
		},
	},
	allowedDevOrigins:["192.168.0.102"]
};

module.exports = nextConfig;

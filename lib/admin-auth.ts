const ADMIN_EMAILS = new Set(
	(process.env.ADMIN_EMAILS ?? '')
		.split(',')
		.map((email) => email.trim().toLowerCase())
		.filter(Boolean),
);

export function isAdminEmail(email: string | null | undefined) {
	return !!email && ADMIN_EMAILS.has(email.trim().toLowerCase());
}

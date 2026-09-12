'use client';

import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
	return (
		<Suspense fallback={null}>
			<LoginForm />
		</Suspense>
	);
}

function LoginForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [email, setEmail] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (searchParams.get('inactive') === '1') {
			setError('Contacte o administrador para regularizar sua conta.');
		}
	}, [searchParams]);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email }),
			});

			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				setError(data.error || 'Não foi possível entrar.');
				setLoading(false);
				return;
			}

			router.replace('/');
			router.refresh();
		} catch {
			setError('Não foi possível entrar. Tente novamente.');
			setLoading(false);
		}
	}

	return (
		<div
			style={{
				fontFamily: "'IBM Plex Mono', monospace",
				background: '#0d324d',
				color: '#f3efe6',
			}}
			className='w-full min-h-screen flex items-center justify-center px-6'>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
				.sl-display { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.03em; }
			`}</style>

			<form
				onSubmit={handleSubmit}
				className='w-full max-w-sm rounded-2xl p-6'
				style={{
					background: '#0d324d',
					border: '1px solid #fff',
				}}>
				<div className='sl-display text-3xl mb-6 text-center' style={{ color: '#f4c430' }}>
					FLUX FINANCE
				</div>

				<label className='block text-xs mb-1 tracking-widest opacity-80'>
					E-MAIL
				</label>
				<input
					autoFocus
					type='email'
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder='seu@email.com'
					autoComplete='email'
					className='w-full rounded-lg px-3 py-2.5 text-sm mb-4 outline-none'
					style={{
						background: '#0d324d',
						border: '1px solid #fff',
						color: '#f3efe6',
					}}
				/>

				{error && (
					<div className='text-xs mb-4 text-center' style={{ color: '#ff6b35' }}>
						{error}
					</div>
				)}

				<button
					type='submit'
					disabled={loading}
					className='w-full rounded-xl py-3 text-xs font-bold tracking-widest disabled:opacity-60'
					style={{ background: '#f4c430', color: '#1c1b19' }}>
					{loading ? 'ENTRANDO...' : 'ENTRAR'}
				</button>
			</form>
		</div>
	);
}

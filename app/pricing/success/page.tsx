'use client';

import { useEffect } from 'react';
import { APP_REDIRECT_STORAGE_KEY } from '../_components/capture-app-redirect';

export default function PricingSuccessPage() {
	useEffect(() => {
		const appRedirect = localStorage.getItem(APP_REDIRECT_STORAGE_KEY);
		if (appRedirect) {
			localStorage.removeItem(APP_REDIRECT_STORAGE_KEY);
			window.location.href = appRedirect;
		}
	}, []);

	return (
		<div className='flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center'>
			<h1 className='text-xl font-semibold text-slate-100'>
				Assinatura confirmada
			</h1>
			<p className='max-w-sm text-sm text-slate-400'>
				Tudo pronto. Volte para o app Flux Finance para continuar — se
				não for redirecionado automaticamente, abra o app manualmente
				e entre com o mesmo email usado na assinatura.
			</p>
		</div>
	);
}

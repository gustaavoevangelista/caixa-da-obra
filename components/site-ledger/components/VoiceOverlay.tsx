import { Mic } from 'lucide-react';
import type { VoiceStatus } from '../hooks/useVoiceCommand';

export function VoiceOverlay({
	status,
	transcript,
	error,
	onStop,
	onRetry,
	onCancel,
}: {
	status: Exclude<VoiceStatus, 'idle'>;
	transcript: string;
	error: string | null;
	onStop: () => void;
	onRetry: () => void;
	onCancel: () => void;
}) {
	const title = status === 'listening' ? 'A OUVIR…' : 'COMANDO DE VOZ';

	return (
		<div className='absolute inset-0 z-40 flex items-end sl-fade-enter'>
			<div
				className='absolute inset-0'
				style={{ background: 'rgba(0,0,0,0.6)' }}
				onClick={onCancel}
			/>
			<div
				className='relative w-full rounded-t-3xl px-5 pt-6 pb-8 flex flex-col items-center sl-sheet-enter'
				style={{ background: 'var(--bg-raised)', borderTop: '1px solid var(--line)' }}>
				<div
					className={`rounded-full flex items-center justify-center mb-4 ${status === 'listening' ? 'sl-pulse' : ''}`}
					style={{
						width: 72,
						height: 72,
						background: status === 'error' ? 'var(--bg-card)' : 'var(--yellow)',
						border: status === 'error' ? '1px solid var(--line)' : 'none',
					}}>
					<Mic
						size={30}
						color={status === 'error' ? 'var(--text-dim)' : '#1c1b19'}
						strokeWidth={2.25}
					/>
				</div>

				<div className='sl-display text-2xl mb-2' style={{ color: 'var(--yellow)' }}>
					{title}
				</div>

				<div
					className='text-sm text-center min-h-[2.5rem] mb-5'
					style={{ color: status === 'error' ? 'var(--orange)' : 'var(--text)' }}
					aria-live='polite'>
					{status === 'error'
						? error
						: transcript || (
								<span style={{ color: 'var(--text-dim)', opacity: 0.7 }}>
									ex. «despesa 50 euros combustível»
								</span>
							)}
				</div>

				<div className='flex gap-2 w-full'>
					<button
						onClick={onCancel}
						className='flex-1 rounded-xl py-3 text-xs font-semibold tracking-widest'
						style={{
							background: 'var(--bg-card)',
							color: 'var(--text-dim)',
							border: '1px solid var(--line)',
						}}>
						CANCELAR
					</button>
					{status === 'listening' && (
						<button
							onClick={onStop}
							className='flex-1 rounded-xl py-3 text-xs font-bold tracking-widest'
							style={{ background: 'var(--yellow)', color: '#1c1b19' }}>
							CONCLUIR
						</button>
					)}
					{status === 'error' && (
						<button
							onClick={onRetry}
							className='flex-1 rounded-xl py-3 text-xs font-bold tracking-widest'
							style={{ background: 'var(--yellow)', color: '#1c1b19' }}>
							TENTAR NOVAMENTE
						</button>
					)}
				</div>
			</div>
		</div>
	);
}

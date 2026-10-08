import { Mic } from 'lucide-react';

export function VoiceButton({ onClick }: { onClick: () => void }) {
	return (
		<button
			onClick={onClick}
			aria-label='Comando de voz'
			className='absolute bottom-9 right-5 z-10 rounded-full flex items-center justify-center shadow-lg'
			style={{
				width: 52,
				height: 52,
				background: 'var(--bg-raised)',
				border: '2px solid var(--yellow)',
			}}>
			<Mic size={22} color='var(--yellow)' strokeWidth={2.25} />
		</button>
	);
}

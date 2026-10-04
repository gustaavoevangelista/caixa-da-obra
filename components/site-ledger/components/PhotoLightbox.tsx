import { X } from 'lucide-react';

export function PhotoLightbox({
	photo,
	onClose,
}: {
	photo: string;
	onClose: () => void;
}) {
	return (
		<div
			className='absolute inset-0 z-40 flex items-center justify-center sl-fade-enter'
			style={{ background: 'rgba(0,0,0,0.9)' }}
			onClick={onClose}>
			<img
				src={photo}
				alt='Recibo'
				className='max-w-full max-h-full object-contain'
				style={{ touchAction: 'pinch-zoom' }}
			/>
			<button
				type='button'
				onClick={onClose}
				className='absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center'
				style={{ background: 'rgba(255,255,255,0.15)' }}>
				<X size={18} color='#fff' />
			</button>
		</div>
	);
}

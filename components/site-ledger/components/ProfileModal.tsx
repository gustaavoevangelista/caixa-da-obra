import { Camera, User } from 'lucide-react';
import type { ChangeEvent } from 'react';

export function ProfileModal({
	profileLogoDraft,
	onChangePhoto,
	profileNameDraft,
	onChangeName,
	onCancel,
	onSave,
	isAdmin,
	onLogout,
}: {
	profileLogoDraft: string | null;
	onChangePhoto: (e: ChangeEvent<HTMLInputElement>) => void;
	profileNameDraft: string;
	onChangeName: (value: string) => void;
	onCancel: () => void;
	onSave: () => void;
	isAdmin: boolean;
	onLogout: () => void;
}) {
	return (
		<div className='absolute inset-0 z-30 flex items-center justify-center px-6 sl-fade-enter'>
			<div
				className='absolute inset-0'
				style={{ background: 'rgba(0,0,0,0.55)' }}
				onClick={onCancel}
			/>
			<div
				className='relative w-full rounded-2xl p-5'
				style={{ background: 'var(--bg-raised)', border: '1px solid var(--line)' }}>
				<div className='sl-display text-2xl mb-4' style={{ color: 'var(--yellow)' }}>
					PERFIL
				</div>

				<div className='flex justify-center mb-4'>
					<label
						className='relative w-24 h-24 rounded-full flex items-center justify-center overflow-hidden cursor-pointer border'
						style={{ borderColor: 'var(--line)', background: 'var(--bg-card)' }}>
						{profileLogoDraft ? (
							<img
								src={profileLogoDraft}
								alt='Logotipo'
								className='w-full h-full object-cover'
							/>
						) : (
							<User size={36} color='var(--text-dim)' />
						)}
						<div
							className='absolute bottom-0 left-0 right-0 flex items-center justify-center py-1.5'
							style={{ background: 'rgba(0,0,0,0.55)' }}>
							<Camera size={14} color='#fff' />
						</div>
						<input
							type='file'
							accept='image/*'
							onChange={onChangePhoto}
							className='hidden'
						/>
					</label>
				</div>

				<input
					value={profileNameDraft}
					onChange={(e) => onChangeName(e.target.value)}
					placeholder='Nome da empresa'
					className='w-full rounded-lg px-3 py-2.5 text-sm mb-4 outline-none'
					style={{
						background: 'var(--bg-card)',
						border: '1px solid var(--line)',
						color: 'var(--text)',
					}}
				/>

				<div className='flex gap-2'>
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
					<button
						onClick={onSave}
						className='flex-1 rounded-xl py-3 text-xs font-bold tracking-widest'
						style={{ background: 'var(--yellow)', color: '#1c1b19' }}>
						GUARDAR
					</button>
				</div>

				{isAdmin && (
					<div className='flex'>
						<a
							href='/admin'
							className='w-full rounded-xl py-3 text-xs font-semibold tracking-widest mt-2 text-center'
							style={{
								background: 'var(--bg-card)',
								color: 'var(--blue)',
								border: '1px solid var(--line)',
							}}>
							ADMIN DASHBOARD
						</a>
					</div>
				)}

				<button
					onClick={onLogout}
					className='w-full rounded-xl py-3 text-xs font-semibold tracking-widest mt-2'
					style={{
						background: 'var(--bg-card)',
						color: 'var(--orange)',
						border: '1px solid var(--line)',
					}}>
					SAIR
				</button>
			</div>
		</div>
	);
}

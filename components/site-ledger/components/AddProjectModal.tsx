export function AddProjectModal({
	newProjectName,
	onChangeName,
	onCancel,
	onCreate,
}: {
	newProjectName: string;
	onChangeName: (value: string) => void;
	onCancel: () => void;
	onCreate: () => void;
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
				<div className='sl-display text-2xl mb-3' style={{ color: 'var(--yellow)' }}>
					NOVO PROJETO
				</div>
				<input
					autoFocus
					value={newProjectName}
					onChange={(e) => onChangeName(e.target.value)}
					onKeyDown={(e) => e.key === 'Enter' && onCreate()}
					placeholder='ex. Reforma Rua das Flores'
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
						onClick={onCreate}
						disabled={!newProjectName.trim()}
						className='flex-1 rounded-xl py-3 text-xs font-bold tracking-widest'
						style={{
							background: newProjectName.trim() ? 'var(--yellow)' : 'var(--bg-card)',
							color: newProjectName.trim() ? '#1c1b19' : 'var(--text-dim)',
							border: newProjectName.trim() ? 'none' : '1px solid var(--line)',
						}}>
						CRIAR
					</button>
				</div>
			</div>
		</div>
	);
}

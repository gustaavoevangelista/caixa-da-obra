import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { Flag, Plus, Settings2 } from 'lucide-react';
import { GENERAL, type Project } from '../types';

export function ProjectSelector({
	projects,
	selectedProject,
	onSelect,
	showActions,
	onAddProject,
	onManage,
}: {
	projects: Project[];
	selectedProject: string;
	onSelect: (id: string) => void;
	showActions: boolean;
	onAddProject: () => void;
	onManage: () => void;
}) {
	const chipScrollRef = useRef<HTMLDivElement | null>(null);
	const dragState = useRef({
		isDown: false,
		startX: 0,
		scrollLeft: 0,
		moved: false,
	});

	const handleChipPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
		if (e.pointerType !== 'mouse') return;
		const el = chipScrollRef.current;
		if (!el) return;
		dragState.current = {
			isDown: true,
			startX: e.clientX,
			scrollLeft: el.scrollLeft,
			moved: false,
		};
	};

	const handleChipPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
		if (!dragState.current.isDown) return;
		const el = chipScrollRef.current;
		if (!el) return;
		const dx = e.clientX - dragState.current.startX;
		if (Math.abs(dx) > 3) dragState.current.moved = true;
		const maxScroll = el.scrollWidth - el.clientWidth;
		const target = dragState.current.scrollLeft - dx;
		el.scrollLeft = Math.max(0, Math.min(maxScroll, target));
	};

	const handleChipPointerUp = () => {
		dragState.current.isDown = false;
	};

	const guardedClick = (fn: () => void) => () => {
		if (!dragState.current.moved) fn();
	};

	return (
		<div>
			<div className='flex items-center justify-between px-5 pb-2 -mt-1'>
				<div
					className='text-[10px] tracking-widest'
					style={{ color: 'var(--text-dim)' }}>
					PROJETO
				</div>
				{showActions && (
					<div className='flex items-center gap-2'>
						<button
							onClick={onAddProject}
							className='w-7 h-7 rounded-md flex items-center justify-center'
							style={{
								background: 'var(--bg-card)',
								border: '1px dashed var(--line)',
							}}
							title='Add project'>
							<Plus size={13} color='var(--text-dim)' />
						</button>
						{projects.length > 0 && (
							<button
								onClick={onManage}
								className='w-7 h-7 rounded-md flex items-center justify-center'
								style={{
									background: 'var(--bg-card)',
									border: '1px solid var(--line)',
								}}
								title='Manage projects'>
								<Settings2 size={12} color='var(--text-dim)' />
							</button>
						)}
					</div>
				)}
			</div>
			<div
				ref={chipScrollRef}
				onPointerDown={handleChipPointerDown}
				onPointerMove={handleChipPointerMove}
				onPointerUp={handleChipPointerUp}
				onPointerLeave={handleChipPointerUp}
				className='flex items-center gap-2 overflow-x-auto sl-scrollbar-none px-5 pb-4'
				style={{
					WebkitOverflowScrolling: 'touch',
					whiteSpace: 'nowrap',
					touchAction: 'pan-x',
					overflowY: 'hidden',
					overscrollBehaviorX: 'contain',
					cursor: 'grab',
					width: '100%',
					boxSizing: 'border-box',
					paddingLeft: '1.25rem',
				}}>
				<button
					onClick={guardedClick(() => onSelect(GENERAL))}
					className='shrink-0 px-3 py-2 rounded-lg text-xs sl-chip flex items-center gap-1.5'
					style={{
						background:
							selectedProject === GENERAL ? 'var(--yellow)' : 'var(--bg-card)',
						color: selectedProject === GENERAL ? '#1c1b19' : 'var(--text)',
						border:
							'1px solid ' +
							(selectedProject === GENERAL ? 'var(--yellow)' : 'var(--line)'),
						fontWeight: selectedProject === GENERAL ? 600 : 400,
					}}>
					Geral
				</button>
				{projects.map((p) => (
					<button
						key={p.id}
						onClick={guardedClick(() => onSelect(p.id))}
						className='shrink-0 px-3 py-2 rounded-lg text-xs sl-chip flex items-center gap-1.5'
						style={{
							background:
								selectedProject === p.id ? 'var(--yellow)' : 'var(--bg-card)',
							color:
								selectedProject === p.id
									? '#1c1b19'
									: p.status === 'ended'
										? 'var(--text-dim)'
										: 'var(--text)',
							border:
								'1px solid ' +
								(selectedProject === p.id ? 'var(--yellow)' : 'var(--line)'),
							fontWeight: selectedProject === p.id ? 600 : 400,
							maxWidth: 140,
							opacity:
								p.status === 'ended' && selectedProject !== p.id ? 0.55 : 1,
						}}>
						<span className='truncate'>{p.name}</span>
						{p.status === 'ended' && <Flag size={10} className='shrink-0' />}
					</button>
				))}
			</div>
		</div>
	);
}

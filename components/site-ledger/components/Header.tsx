import { ArrowLeft, BarChart3, Receipt, User } from 'lucide-react';

type ViewName = 'home' | 'reports' | 'invoices';

export function Header({
	companyName,
	companyLogo,
	onOpenProfile,
	view,
	onChangeView,
	isPremiumUser,
}: {
	companyName: string;
	companyLogo: string | null;
	onOpenProfile: () => void;
	view: ViewName;
	onChangeView: (view: ViewName) => void;
	isPremiumUser: boolean;
}) {
	return (
		<div className='px-5 pt-6 pb-4 flex items-center justify-between'>
			<div>
				<div
					className='sl-display text-3xl leading-none'
					style={{ color: 'var(--yellow)' }}>
					FLUX FINANCE
				</div>
				<div
					className='text-[10px] tracking-widest mt-1'
					style={{ color: 'var(--text-dim)' }}>
					CONTROLE DE DESPESAS E RECEITAS
				</div>
			</div>
			<div className='flex items-center gap-2'>
				<button
					onClick={onOpenProfile}
					className='w-11 h-11 rounded-full flex items-center justify-center border overflow-hidden'
					style={{
						borderColor: 'var(--line)',
						background: 'var(--bg-raised)',
					}}>
					{companyLogo ? (
						<img
							src={companyLogo}
							alt={companyName || 'Perfil'}
							className='w-full h-full object-cover'
						/>
					) : (
						<User size={20} color='var(--text-dim)' />
					)}
				</button>
				<button
					onClick={() => onChangeView(view === 'reports' ? 'home' : 'reports')}
					className='w-11 h-11 rounded-full flex items-center justify-center border'
					style={{
						borderColor: 'var(--line)',
						background: 'var(--bg-raised)',
					}}>
					{view === 'reports' ? (
						<ArrowLeft size={24} color='var(--yellow)' />
					) : (
						<BarChart3 size={24} color='var(--yellow)' />
					)}
				</button>
				{isPremiumUser && (
					<button
						onClick={() =>
							onChangeView(view === 'invoices' ? 'home' : 'invoices')
						}
						className='w-11 h-11 rounded-full flex items-center justify-center border'
						style={{
							borderColor: 'var(--line)',
							background: 'var(--bg-raised)',
						}}>
						{view === 'invoices' ? (
							<ArrowLeft size={24} color='var(--yellow)' />
						) : (
							<Receipt size={24} color='var(--yellow)' />
						)}
					</button>
				)}
			</div>
		</div>
	);
}

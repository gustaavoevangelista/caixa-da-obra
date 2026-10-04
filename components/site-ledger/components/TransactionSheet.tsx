import { Camera, Delete, Layers, Settings2, Trash2, X } from 'lucide-react';
import type { ChangeEvent } from 'react';
import type { Category } from '@/lib/default-categories';
import type { TransactionType } from '../types';
import { Spinner } from './Spinner';

const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'];

export function TransactionSheet({
	editingId,
	projectContextLabel,
	txType,
	onChangeType,
	amount,
	activeCats,
	category,
	onSelectCategory,
	onManageCategories,
	description,
	onChangeDescription,
	isPremiumUser,
	photoDraft,
	onChangePhoto,
	onRemovePhoto,
	onOpenLightbox,
	photoError,
	saveError,
	onPressDigit,
	onBackspace,
	canSave,
	saving,
	deleting,
	onSave,
	sheetDeleteConfirm,
	onRequestDeleteConfirm,
	onCancelDeleteConfirm,
	onDelete,
	onClose,
}: {
	editingId: string | null;
	projectContextLabel: string;
	txType: TransactionType;
	onChangeType: (type: TransactionType) => void;
	amount: string;
	activeCats: Category[];
	category: string | null;
	onSelectCategory: (id: string) => void;
	onManageCategories: () => void;
	description: string;
	onChangeDescription: (value: string) => void;
	isPremiumUser: boolean;
	photoDraft: string | null;
	onChangePhoto: (e: ChangeEvent<HTMLInputElement>) => void;
	onRemovePhoto: () => void;
	onOpenLightbox: (photo: string) => void;
	photoError: string | null;
	saveError: boolean;
	onPressDigit: (digit: string) => void;
	onBackspace: () => void;
	canSave: boolean;
	saving: boolean;
	deleting: boolean;
	onSave: () => void;
	sheetDeleteConfirm: boolean;
	onRequestDeleteConfirm: () => void;
	onCancelDeleteConfirm: () => void;
	onDelete: () => void;
	onClose: () => void;
}) {
	return (
		<div className='absolute inset-0 z-20 flex flex-col justify-end sl-fade-enter'>
			<div
				className='absolute inset-0'
				style={{ background: 'rgba(0,0,0,0.55)' }}
				onClick={onClose}
			/>
			<div
				className='relative rounded-t-3xl p-5 pb-8 sl-sheet-enter'
				style={{
					background: 'var(--bg-raised)',
					border: '1px solid var(--line)',
					borderBottom: 'none',
					maxHeight: '92dvh',
					overflowY: 'auto',
					WebkitOverflowScrolling: 'touch',
				}}>
				<div className='flex items-center justify-between mb-1'>
					<div className='sl-display text-2xl' style={{ color: 'var(--yellow)' }}>
						{editingId ? 'EDITAR ENTRADA' : 'NOVA ENTRADA'}
					</div>
					<button
						onClick={onClose}
						className='w-8 h-8 rounded-full flex items-center justify-center'
						style={{ background: 'var(--bg-card)' }}>
						<X size={16} />
					</button>
				</div>
				<div
					className='flex items-center gap-1.5 mb-4 text-xs'
					style={{ color: 'var(--text-dim)' }}>
					<Layers size={12} />
					{editingId ? 'Projeto: ' : 'Adicionando em: '}
					<span style={{ color: 'var(--text)' }}>{projectContextLabel}</span>
				</div>

				{/* Type toggle */}
				<div className='flex rounded-xl p-1 mb-4' style={{ background: 'var(--bg-card)' }}>
					{(['expense', 'income'] as const).map((t) => (
						<button
							key={t}
							onClick={() => onChangeType(t)}
							className='flex-1 py-2.5 rounded-lg text-xs font-semibold tracking-widest sl-chip'
							style={{
								background:
									txType === t
										? t === 'expense'
											? 'var(--orange)'
											: 'var(--green)'
										: 'transparent',
								color: txType === t ? '#1c1b19' : 'var(--text-dim)',
							}}>
							{t === 'expense' ? 'DESPESA' : 'RECEITA'}
						</button>
					))}
				</div>

				{/* Amount display */}
				<div className='text-center mb-4'>
					<div
						className='sl-display text-5xl'
						style={{ color: amount ? 'var(--text)' : 'var(--text-dim)' }}>
						€{amount || '0'}
					</div>
				</div>

				{/* Category chips */}
				<div className='flex flex-wrap gap-2 mb-4'>
					{activeCats.map((c) => (
						<button
							key={c.id}
							onClick={() => onSelectCategory(c.id)}
							className='px-3 py-2 rounded-lg text-xs sl-chip'
							style={{
								background: category === c.id ? 'var(--yellow)' : 'var(--bg-card)',
								color: category === c.id ? '#1c1b19' : 'var(--text)',
								border:
									'1px solid ' +
									(category === c.id ? 'var(--yellow)' : 'var(--line)'),
								fontWeight: category === c.id ? 600 : 400,
							}}>
							{c.label}
						</button>
					))}

					{/* Category management buttons */}
					<button
						className='px-3 py-2 rounded-lg text-xs sl-chip'
						style={{
							background: 'var(--bg-card)',
							color: 'var(--text-dim)',
							border: '1px solid var(--line)',
						}}
						onClick={onManageCategories}
						title='Manage categories'>
						<Settings2 size={12} />
					</button>
				</div>

				{/* Description */}
				<input
					value={description}
					onChange={(e) => onChangeDescription(e.target.value)}
					placeholder='Descrição (opcional)'
					className='w-full rounded-lg px-3 py-2.5 text-sm mb-4 outline-none'
					style={{
						background: 'var(--bg-card)',
						border: '1px solid var(--line)',
						color: 'var(--text)',
					}}
				/>

				{isPremiumUser && (
					<div className='flex items-center gap-3 mb-4'>
						<label
							className='flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs cursor-pointer'
							style={{
								background: 'var(--bg-card)',
								border: '1px solid var(--line)',
								color: 'var(--text)',
							}}>
							<Camera size={14} />
							{photoDraft ? 'Trocar foto' : 'Anexar foto do recibo'}
							<input
								type='file'
								accept='image/*'
								capture='environment'
								onChange={onChangePhoto}
								className='hidden'
							/>
						</label>
						{photoDraft && (
							<div className='relative w-11 h-11 rounded-lg overflow-hidden shrink-0'>
								<button
									type='button'
									onClick={() => onOpenLightbox(photoDraft)}
									className='block w-full h-full'>
									<img
										src={photoDraft}
										alt='Recibo'
										className='w-full h-full object-cover'
									/>
								</button>
								<button
									type='button'
									onClick={onRemovePhoto}
									className='absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center'
									style={{ background: 'var(--orange)', color: '#1c1b19' }}>
									<X size={12} />
								</button>
							</div>
						)}
					</div>
				)}

				{photoError && (
					<div className='text-xs mb-3 text-center' style={{ color: 'var(--orange)' }}>
						{photoError}
					</div>
				)}

				{saveError && (
					<div className='text-xs mb-3 text-center' style={{ color: 'var(--orange)' }}>
						Digite um valor e escolha uma categoria para salvar.
					</div>
				)}

				{/* Keypad */}
				<div className='grid grid-cols-3 gap-2 mb-4'>
					{KEYPAD_KEYS.map((k) => (
						<button
							key={k}
							onClick={() => (k === 'back' ? onBackspace() : onPressDigit(k))}
							className='sl-keypad-btn rounded-xl py-3.5 flex items-center justify-center text-lg font-medium'
							style={{
								background: 'var(--bg-card)',
								border: '1px solid var(--line)',
							}}>
							{k === 'back' ? <Delete size={18} /> : k}
						</button>
					))}
				</div>

				<button
					onClick={onSave}
					disabled={saving || deleting}
					className='w-full rounded-xl py-3.5 text-sm font-bold tracking-widest flex items-center justify-center gap-2'
					style={{
						background: canSave ? 'var(--yellow)' : 'var(--bg-card)',
						color: canSave ? '#1c1b19' : 'var(--text-dim)',
						border: canSave ? 'none' : '1px solid var(--line)',
						opacity: saving || deleting ? 0.6 : 1,
						cursor: saving || deleting ? 'not-allowed' : 'pointer',
					}}>
					{saving && <Spinner />}
					{editingId ? 'GUARDAR ALTERAÇÕES' : 'GUARDAR LANÇAMENTO'}
				</button>

				{editingId && (
					<div className='mt-3'>
						{sheetDeleteConfirm ? (
							<div
								className='flex items-center justify-between px-4 py-3 rounded-xl'
								style={{ background: 'var(--bg-card)', border: '1px solid var(--line)' }}>
								<span className='text-xs' style={{ color: 'var(--text-dim)' }}>
									Excluir esta entrada?
								</span>
								<div className='flex gap-2'>
									<button
										onClick={onCancelDeleteConfirm}
										disabled={deleting}
										className='text-xs px-3 py-1.5 rounded-md'
										style={{
											background: 'var(--bg-raised)',
											color: 'var(--text)',
											opacity: deleting ? 0.6 : 1,
										}}>
										Cancelar
									</button>
									<button
										onClick={onDelete}
										disabled={saving || deleting}
										className='text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5'
										style={{
											background: 'var(--orange)',
											color: '#1c1b19',
											opacity: saving || deleting ? 0.6 : 1,
											cursor: saving || deleting ? 'not-allowed' : 'pointer',
										}}>
										{deleting && <Spinner size={12} />}
										Excluir
									</button>
								</div>
							</div>
						) : (
							<button
								onClick={onRequestDeleteConfirm}
								className='w-full flex items-center justify-center gap-1.5 py-3 text-xs font-semibold tracking-widest'
								style={{ color: 'var(--orange)' }}>
								<Trash2 size={14} />
								EXCLUIR ENTRADA
							</button>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

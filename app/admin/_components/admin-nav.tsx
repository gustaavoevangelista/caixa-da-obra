'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { SignOutButton } from '@clerk/nextjs';
import { ChevronDown, LogOut, MoveLeft } from 'lucide-react';

export function AdminNav() {
	const [open, setOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;

		function handlePointerDown(event: PointerEvent) {
			if (!menuRef.current?.contains(event.target as Node)) {
				setOpen(false);
			}
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') setOpen(false);
		}

		document.addEventListener('pointerdown', handlePointerDown);
		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('pointerdown', handlePointerDown);
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [open]);

	return (
		<nav className='flex items-center justify-between border-b border-slate-800 px-6 py-4'>
			<div className='flex items-center gap-6'>
				<Link
					href='/admin'
					className='text-sm font-semibold text-slate-100'
				>
					Flux Finance — Admin
				</Link>
				<Link
					href='/admin/users'
					className='text-sm text-slate-400 hover:text-slate-100'
				>
					Clientes
				</Link>
				<Link
					href='/admin/create-user'
					className='text-sm text-slate-400 hover:text-slate-100'
				>
					Novo cliente
				</Link>
			</div>
			<div
				ref={menuRef}
				className='relative'
			>
				<button
					type='button'
					onClick={() => setOpen((value) => !value)}
					aria-haspopup='menu'
					aria-expanded={open}
					className='flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-slate-400 hover:bg-slate-900 hover:text-slate-100'
				>
					Menu
					<ChevronDown
						size={16}
						className={open ? 'rotate-180 transition-transform' : 'transition-transform'}
					/>
				</button>
				{open && (
					<div
						role='menu'
						className='absolute right-0 top-full z-10 mt-2 w-48 rounded-lg border border-slate-800 bg-slate-950 py-1 shadow-lg'
					>
						<Link
							href='/'
							role='menuitem'
							onClick={() => setOpen(false)}
							className='flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:bg-slate-900 hover:text-slate-100'
						>
							<MoveLeft size={16} />
							Voltar ao app
						</Link>
						<SignOutButton redirectUrl='/'>
							<button
								type='button'
								role='menuitem'
								className='flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-400 hover:bg-slate-900 hover:text-slate-100'
							>
								<LogOut size={16} />
								Sair
							</button>
						</SignOutButton>
					</div>
				)}
			</div>
		</nav>
	);
}

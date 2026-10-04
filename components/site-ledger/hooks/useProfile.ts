import { useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';

const resizeImageToDataUrl = (file: File): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = () => reject(new Error('Read failed'));
		reader.onload = () => {
			const img = new Image();
			img.onerror = () => reject(new Error('Decode failed'));
			img.onload = () => {
				const SIZE = 200;
				const canvas = document.createElement('canvas');
				canvas.width = SIZE;
				canvas.height = SIZE;
				const ctx = canvas.getContext('2d');
				if (!ctx) {
					reject(new Error('Canvas unavailable'));
					return;
				}
				const scale = Math.max(SIZE / img.width, SIZE / img.height);
				const drawWidth = img.width * scale;
				const drawHeight = img.height * scale;
				const dx = (SIZE - drawWidth) / 2;
				const dy = (SIZE - drawHeight) / 2;
				ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
				resolve(canvas.toDataURL('image/png'));
			};
			img.src = reader.result as string;
		};
		reader.readAsDataURL(file);
	});

export function useProfile({
	companyName,
	companyLogo,
	persistProfile,
}: {
	companyName: string;
	companyLogo: string | null;
	persistProfile: (nextName: string, nextLogo: string | null) => Promise<void>;
}) {
	const router = useRouter();
	const [profileOpen, setProfileOpen] = useState(false);
	const [profileNameDraft, setProfileNameDraft] = useState('');
	const [profileLogoDraft, setProfileLogoDraft] = useState<string | null>(
		null,
	);

	const openProfile = () => {
		setProfileNameDraft(companyName);
		setProfileLogoDraft(companyLogo);
		setProfileOpen(true);
	};

	const closeProfile = () => {
		setProfileOpen(false);
	};

	const handleLogout = async () => {
		await fetch('/api/auth/logout', { method: 'POST' });
		router.replace('/login');
		router.refresh();
	};

	const handleProfilePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		e.target.value = '';
		if (!file) return;
		try {
			const dataUrl = await resizeImageToDataUrl(file);
			setProfileLogoDraft(dataUrl);
		} catch (err) {
			console.error('Image processing error:', err);
		}
	};

	const handleSaveProfile = async () => {
		await persistProfile(profileNameDraft.trim(), profileLogoDraft);
		setProfileOpen(false);
	};

	return {
		profileOpen,
		profileNameDraft,
		setProfileNameDraft,
		profileLogoDraft,
		openProfile,
		closeProfile,
		handleLogout,
		handleProfilePhotoChange,
		handleSaveProfile,
	};
}

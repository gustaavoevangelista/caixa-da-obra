export const MAX_RECEIPT_PHOTO_DIMENSION = 1600;
export const RECEIPT_PHOTO_JPEG_QUALITY = 0.8;
export const MAX_RECEIPT_PHOTO_DATA_URL_LENGTH = 2_000_000;

export function computeScaledDimensions(
	width: number,
	height: number,
	maxDimension: number,
): { width: number; height: number } {
	const longestSide = Math.max(width, height);
	if (longestSide <= maxDimension) {
		return { width, height };
	}
	const scale = maxDimension / longestSide;
	return {
		width: Math.round(width * scale),
		height: Math.round(height * scale),
	};
}

export function resizeReceiptPhotoToDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = () => reject(new Error('Read failed'));
		reader.onload = () => {
			const img = new Image();
			img.onerror = () => reject(new Error('Decode failed'));
			img.onload = () => {
				const { width, height } = computeScaledDimensions(
					img.width,
					img.height,
					MAX_RECEIPT_PHOTO_DIMENSION,
				);
				const canvas = document.createElement('canvas');
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext('2d');
				if (!ctx) {
					reject(new Error('Canvas unavailable'));
					return;
				}
				ctx.drawImage(img, 0, 0, width, height);
				const dataUrl = canvas.toDataURL(
					'image/jpeg',
					RECEIPT_PHOTO_JPEG_QUALITY,
				);
				if (dataUrl.length > MAX_RECEIPT_PHOTO_DATA_URL_LENGTH) {
					reject(new Error('Photo too large'));
					return;
				}
				resolve(dataUrl);
			};
			img.src = reader.result as string;
		};
		reader.readAsDataURL(file);
	});
}

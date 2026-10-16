import { useState } from 'react';
import { getJwtToken, refreshAccessToken } from '../auth';
import { ClientMessages, REACT_APP_API_URL } from '../config';

/** The API's limits (upload.controller.ts): 5 MB, and it checks the bytes, not the name. */
export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export type UploadTarget = 'member' | 'clinic' | 'doctor' | 'article';

/**
 * Images go over REST, not GraphQL (no apollo-upload-client): `POST /upload/image?target=`,
 * multipart `file`, the access token in the header. An expired token is refreshed once and the
 * upload retried — the same rule as the Apollo error link. Returns the stored path. Errors carry
 * ClientMessages keys (translate them) or the server's own text.
 */
const useUpload = () => {
	const [uploading, setUploading] = useState<boolean>(false);

	const send = (file: File, target: UploadTarget): Promise<Response> => {
		const form = new FormData();
		form.append('file', file);
		return fetch(`${REACT_APP_API_URL}/upload/image?target=${target}`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${getJwtToken()}` },
			credentials: 'include',
			body: form,
		});
	};

	const upload = async (file: File, target: UploadTarget): Promise<string> => {
		if (!UPLOAD_TYPES.includes(file.type)) throw new Error(ClientMessages.IMAGE_TYPE);
		if (file.size > UPLOAD_MAX_BYTES) throw new Error(ClientMessages.IMAGE_TOO_BIG);
		setUploading(true);
		try {
			let response = await send(file, target);
			if (response.status === 401 && (await refreshAccessToken())) response = await send(file, target);
			const body = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(body?.message ?? ClientMessages.UPLOAD_FAILED);
			return body.url as string;
		} finally {
			setUploading(false);
		}
	};

	return { upload, uploading };
};

export default useUpload;

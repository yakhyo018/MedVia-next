import { useState } from 'react';
import { getJwtToken, refreshAccessToken } from '../auth';
import { ClientMessages, REACT_APP_API_URL } from '../config';
import { FaceScan } from '../types/face-scan/face-scan';

/** The API's limit (face-scan.rules.ts). The browser sends a ~1280px JPEG, far below it. */
export const FACE_SCAN_MAX_BYTES = 5 * 1024 * 1024;

/**
 * The photo goes over REST like every image (`POST /face-scan`, multipart `file`), never through
 * GraphQL. An expired access token is refreshed once and the request retried — the Apollo error
 * link's rule. The answer is the stored reading; the photo is not kept anywhere.
 */
const useFaceScan = () => {
	const [scanning, setScanning] = useState<boolean>(false);

	const send = (photo: Blob): Promise<Response> => {
		const form = new FormData();
		form.append('file', photo, 'face.jpg');
		return fetch(`${REACT_APP_API_URL}/face-scan`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${getJwtToken()}` },
			credentials: 'include',
			body: form,
		});
	};

	const scan = async (photo: Blob): Promise<FaceScan> => {
		if (photo.size > FACE_SCAN_MAX_BYTES) throw new Error(ClientMessages.IMAGE_TOO_BIG);
		setScanning(true);
		try {
			let response = await send(photo);
			if (response.status === 401 && (await refreshAccessToken())) response = await send(photo);
			const body = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(body?.message ?? ClientMessages.UPLOAD_FAILED);
			return body as FaceScan;
		} finally {
			setScanning(false);
		}
	};

	return { scan, scanning };
};

export default useFaceScan;

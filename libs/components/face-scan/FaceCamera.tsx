import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { Button, Stack } from '@mui/material';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded';
import type { FaceDetector } from '@mediapipe/tasks-vision';

/** The version installed in package.json — the WASM files must match the JS. */
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2/wasm';
/** BlazeFace short range (~230 KB): a face box is all the checks need, no 478-point mesh. */
const MODEL_URL =
	'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';
/** The longest side sent to the API: enough for skin, far below the 5 MB limit. */
const MAX_SIDE = 1280;
/** Checks run 5 times a second, not on every frame: the phone stays cool. */
const CHECK_MS = 200;

/** What the live check says; the i18n key is the English sentence. */
type Hint = 'loading' | 'no-face' | 'many' | 'closer' | 'center' | 'light' | 'ready';

const HINT_TEXT: Record<Hint, string> = {
	loading: 'Starting the camera…',
	'no-face': 'Look straight at the camera',
	many: 'Only one face in the frame, please',
	closer: 'Come a little closer',
	center: 'Move your face to the centre',
	light: 'Find more light — face a window',
	ready: 'Hold still — ready',
};

interface FaceCameraProps {
	/** A JPEG without metadata, and a preview URL for it. */
	onPhoto: (photo: Blob, preview: string) => void;
	disabled?: boolean;
}

/** Average luma (0–255) of a frame, read from a 64 × 48 copy — cheap enough five times a second. */
const brightness = (source: CanvasImageSource, canvas: HTMLCanvasElement): number => {
	canvas.width = 64;
	canvas.height = 48;
	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) return 255;
	ctx.drawImage(source, 0, 0, 64, 48);
	const { data } = ctx.getImageData(0, 0, 64, 48);
	let sum = 0;
	for (let i = 0; i < data.length; i += 4) sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
	return sum / (data.length / 4);
};

/**
 * Re-draws a frame or a chosen file into a new JPEG. Drawing keeps only pixels: the EXIF block
 * (GPS, phone model, time) of a gallery photo does not survive — the server strips it again anyway.
 */
const toJpeg = (source: CanvasImageSource, width: number, height: number): Promise<Blob> => {
	const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
	const canvas = document.createElement('canvas');
	canvas.width = Math.round(width * scale);
	canvas.height = Math.round(height * scale);
	canvas.getContext('2d')?.drawImage(source, 0, 0, canvas.width, canvas.height);
	return new Promise((resolve, reject) =>
		canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('capture failed'))), 'image/jpeg', 0.9),
	);
};

/**
 * The camera with live guidance (MediaPipe face detection in the browser — the video never leaves
 * the device), or a photo from the gallery. Only the one frame the patient takes is sent.
 */
const FaceCamera = (props: FaceCameraProps) => {
	const { onPhoto, disabled = false } = props;
	const { t } = useTranslation('common');
	const videoRef = useRef<HTMLVideoElement>(null);
	const fileRef = useRef<HTMLInputElement>(null);
	const probeRef = useRef<HTMLCanvasElement | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const detectorRef = useRef<FaceDetector | null>(null);
	const timerRef = useRef<number | null>(null);
	const [live, setLive] = useState<boolean>(false);
	const [hint, setHint] = useState<Hint>('loading');
	const [cameraError, setCameraError] = useState<boolean>(false);
	/** No detector (CDN blocked, old browser): the camera still works, without hints. */
	const [guided, setGuided] = useState<boolean>(true);

	const stopCamera = () => {
		if (timerRef.current !== null) window.clearInterval(timerRef.current);
		timerRef.current = null;
		streamRef.current?.getTracks().forEach((track) => track.stop());
		streamRef.current = null;
		setLive(false);
	};

	/** LIFECYCLES **/
	useEffect(() => {
		return () => {
			stopCamera();
			detectorRef.current?.close();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const check = () => {
		const video = videoRef.current;
		const detector = detectorRef.current;
		if (!video || video.readyState < 2) return;
		probeRef.current = probeRef.current ?? document.createElement('canvas');
		if (!detector) {
			setHint(brightness(video, probeRef.current) < 60 ? 'light' : 'ready');
			return;
		}
		const faces = detector.detectForVideo(video, performance.now()).detections;
		if (faces.length === 0) return setHint('no-face');
		if (faces.length > 1) return setHint('many');
		const box = faces[0].boundingBox;
		if (!box) return setHint('no-face');
		if (box.width / video.videoWidth < 0.28) return setHint('closer');
		const dx = (box.originX + box.width / 2) / video.videoWidth - 0.5;
		const dy = (box.originY + box.height / 2) / video.videoHeight - 0.5;
		if (Math.abs(dx) > 0.18 || Math.abs(dy) > 0.2) return setHint('center');
		if (brightness(video, probeRef.current) < 60) return setHint('light');
		setHint('ready');
	};

	/** HANDLERS **/
	const startCameraHandler = async () => {
		setCameraError(false);
		setHint('loading');
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
				audio: false,
			});
			streamRef.current = stream;
			setLive(true);
			const video = videoRef.current;
			if (video) {
				video.srcObject = stream;
				await video.play();
			}
		} catch {
			setCameraError(true);
			return;
		}
		if (!detectorRef.current) {
			try {
				const { FaceDetector: Detector, FilesetResolver } = await import('@mediapipe/tasks-vision');
				const files = await FilesetResolver.forVisionTasks(WASM_URL);
				detectorRef.current = await Detector.createFromOptions(files, {
					baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
					runningMode: 'VIDEO',
				});
			} catch {
				setGuided(false);
			}
		}
		timerRef.current = window.setInterval(check, CHECK_MS);
	};

	const captureHandler = async () => {
		const video = videoRef.current;
		if (!video) return;
		const photo = await toJpeg(video, video.videoWidth, video.videoHeight);
		stopCamera();
		onPhoto(photo, URL.createObjectURL(photo));
	};

	const fileHandler = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		event.target.value = '';
		if (!file) return;
		const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
		const photo = await toJpeg(bitmap, bitmap.width, bitmap.height);
		bitmap.close();
		stopCamera();
		onPhoto(photo, URL.createObjectURL(photo));
	};

	return (
		<div className={`face-camera ${live ? 'live' : ''}`}>
			<div className={'viewport'}>
				{/* Mirrored on screen like a selfie camera; the captured frame is not mirrored. */}
				<video ref={videoRef} playsInline muted aria-label={t('Camera preview')} />
				{live && (
					<>
						<span className={`oval ${hint === 'ready' ? 'ok' : ''}`} aria-hidden={'true'} />
						<span className={`hint ${hint === 'ready' ? 'ok' : ''}`} role={'status'}>
							{t(HINT_TEXT[hint])}
						</span>
					</>
				)}
				{!live && (
					<div className={'idle'}>
						<PhotoCameraOutlinedIcon />
						<p>{t('Face the light, no make-up or filters, hair away from the face.')}</p>
					</div>
				)}
			</div>
			{cameraError && (
				<p className={'error'}>{t('The camera is not available. Allow it in the browser, or choose a photo.')}</p>
			)}
			{live && !guided && <p className={'note'}>{t('Live guidance could not load — the photo still works.')}</p>}
			<Stack direction={'row'} className={'actions'}>
				{live ? (
					<Button
						variant={'contained'}
						startIcon={<CameraAltRoundedIcon />}
						onClick={captureHandler}
						disabled={disabled || (guided && hint !== 'ready')}
					>
						{t('Take the photo')}
					</Button>
				) : (
					<Button
						variant={'contained'}
						startIcon={<PhotoCameraOutlinedIcon />}
						onClick={startCameraHandler}
						disabled={disabled}
					>
						{t('Open the camera')}
					</Button>
				)}
				<Button
					variant={'outlined'}
					startIcon={<ImageOutlinedIcon />}
					onClick={() => fileRef.current?.click()}
					disabled={disabled}
				>
					{t('Choose a photo')}
				</Button>
				<input
					ref={fileRef}
					type={'file'}
					accept={'image/jpeg,image/png,image/webp'}
					hidden
					onChange={fileHandler}
				/>
			</Stack>
		</div>
	);
};

export default FaceCamera;

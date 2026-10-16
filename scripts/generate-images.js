/**
 * The site's own photos (public/img), made once and committed — the same model and route as the
 * API's seed photos (~/Desktop/MedVia: npm run photos:generate):
 *   FLUX.1 Krea [dev] through Hugging Face Inference Providers (fal-ai), paid from HF credits —
 *   $0.025 per started megapixel, so every size stays under 1 MP.
 *
 *   yarn images:generate                    only files whose prompt changed or that are missing
 *   yarn images:generate --file=hero.jpg    one file
 *   yarn images:generate --force            every file again
 *
 * HF_TOKEN comes from the environment, else from the API's .env next door (the frontend's own env
 * files never hold it). Prompts are recorded in docs/IMAGES.md. On macOS `sips` shrinks each
 * file to web size.
 */
const { execFileSync } = require('child_process');
const { createHash } = require('crypto');
const fs = require('fs');
const path = require('path');

const MODEL = 'black-forest-labs/FLUX.1-Krea-dev';
const ENDPOINT = 'https://router.huggingface.co/fal-ai/fal-ai/flux/krea';
const IMG = path.join(__dirname, '..', 'public', 'img');
// Kept outside public/: neither file is served.
const MANIFEST = path.join(__dirname, 'images-manifest.json');
const SOURCES = path.join(__dirname, '..', 'docs', 'IMAGES.md');
const PHOTO = 'candid documentary photograph, natural light, realistic skin texture, no text, no logos';

const JOBS = [
	{
		file: 'hero.jpg',
		prompt:
			'A Korean female doctor in a white coat talking warmly with a foreign male patient across a desk ' +
			'in a bright modern Seoul clinic consultation room, the patient seen from behind over his shoulder ' +
			`on the left, the doctor on the right, plants and shelves behind her, ${PHOTO}`,
		width: 1312,
		height: 736,
		maxSide: 1200,
	},
	{
		file: 'login.jpg',
		prompt:
			'Traditional hanok tiled roofs of Bukchon village in the foreground, the modern Seoul skyline and ' +
			'Namsan tower in the distance, clear blue sky with soft clouds, travel photograph, no people, no text',
		width: 1152,
		height: 864,
		maxSide: 1000,
	},
	{
		file: 'signup.jpg',
		prompt:
			'Seoul city skyline at dusk seen from a hill, Han river, city lights turning on under a deep blue ' +
			'and orange sky, long exposure travel photograph, no people, no text',
		width: 1152,
		height: 864,
		maxSide: 1200,
	},
	{
		file: 'treatments/dermatology.jpg',
		prompt:
			'A young Central Asian woman lying on a treatment bed with eyes closed during a gentle facial skin ' +
			'treatment at a Seoul dermatology clinic, a dermatologist in mint-green gloves holding a small handheld ' +
			`device near her cheek, white and teal tones, ${PHOTO}`,
		width: 1216,
		height: 816,
		maxSide: 1200,
	},
	{
		file: 'treatments/plastic-surgery.jpg',
		prompt:
			'A Korean male plastic surgeon in a white coat showing a tablet with a 3D face model to a smiling ' +
			'Russian woman patient with light brown hair in a casual beige sweater, bright modern aesthetic ' +
			'clinic consultation room, ' +
			PHOTO,
		width: 1216,
		height: 816,
		maxSide: 1200,
	},
	{
		file: 'treatments/dental.jpg',
		prompt:
			'A smiling middle-aged foreign man in a modern dental chair talking with a Korean dentist in a mask ' +
			'pulled down, bright clean dental clinic with an overhead light and a monitor, ' +
			PHOTO,
		width: 1216,
		height: 816,
		maxSide: 1200,
	},
	{
		file: 'treatments/check-up.jpg',
		prompt:
			'A Korean female doctor in a white coat measuring the blood pressure of a fully dressed middle-aged ' +
			'Kazakh man sitting at a desk in a bright health check-up centre, an ultrasound machine and an ' +
			'examination bed in the background, ' +
			PHOTO,
		width: 1216,
		height: 816,
		maxSide: 1200,
	},
];

const token = () => {
	if (process.env.HF_TOKEN) return process.env.HF_TOKEN;
	const apiEnv = path.join(__dirname, '..', '..', 'MedVia', '.env');
	const line = fs.existsSync(apiEnv)
		? fs
				.readFileSync(apiEnv, 'utf8')
				.split('\n')
				.find((l) => l.startsWith('HF_TOKEN='))
		: undefined;
	const value = line?.slice('HF_TOKEN='.length).trim();
	if (!value) throw new Error('HF_TOKEN is missing (environment or ../MedVia/.env).');
	return value;
};

/** The same file always gets the same seeds: a rerun with --force reproduces it. */
const seedOf = (file, attempt) =>
	createHash('sha256')
		.update(attempt ? `${file}#${attempt}` : file)
		.digest()
		.readUInt32BE(0);

/** fal's safety checker sometimes flags a harmless scene; the next seed usually passes. */
const ATTEMPTS = 3;

async function generate(job, hfToken, attempt = 0) {
	const res = await fetch(ENDPOINT, {
		method: 'POST',
		headers: { Authorization: `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			prompt: job.prompt,
			image_size: { width: job.width, height: job.height },
			seed: seedOf(job.file, attempt),
			output_format: 'jpeg',
			sync_mode: true,
		}),
	});
	if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
	const body = await res.json();
	// The safety checker returns a black frame instead of refusing: another seed, then an error.
	if (body.has_nsfw_concepts?.[0]) {
		if (attempt + 1 < ATTEMPTS) return generate(job, hfToken, attempt + 1);
		throw new Error(`Blocked by the safety checker ${ATTEMPTS} times (black images); change the prompt.`);
	}
	const url = body.images?.[0]?.url;
	if (!url) throw new Error('No image in the response.');
	if (url.startsWith('data:')) return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
	const image = await fetch(url);
	if (!image.ok) throw new Error(`Image download: HTTP ${image.status}`);
	return Buffer.from(await image.arrayBuffer());
}

const shrink = (target, maxSide) => {
	if (process.platform !== 'darwin') return console.warn(`  ${target} kept at full size (sips is macOS only)`);
	execFileSync('sips', ['-Z', String(maxSide), '-s', 'formatOptions', '80', target], { stdio: 'ignore' });
};

function writeSources(manifest) {
	const lines = [
		'# Site photos — sources',
		'',
		`Generated with **${MODEL}** through Hugging Face Inference Providers (fal-ai) by`,
		'`yarn images:generate`. The people shown are generated and are nobody real.',
		'',
		'| File | Prompt |',
		'| --- | --- |',
		...Object.keys(manifest)
			.sort()
			.map((file) => `| \`${file}\` | ${manifest[file].replace(/\|/g, '\\|')} |`),
		'',
	];
	fs.writeFileSync(SOURCES, lines.join('\n'));
}

async function main() {
	const hfToken = token();
	const file = process.argv.find((a) => a.startsWith('--file='))?.slice('--file='.length);
	const force = process.argv.includes('--force');
	const jobs = JOBS.filter((job) => !file || job.file === file);
	if (file && !jobs.length) throw new Error(`No image ${file}.`);
	const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
	let made = 0;
	for (const job of jobs) {
		const target = path.join(IMG, job.file);
		if (!force && manifest[job.file] === job.prompt && fs.existsSync(target)) continue;
		try {
			fs.mkdirSync(path.dirname(target), { recursive: true });
			fs.writeFileSync(target, await generate(job, hfToken));
			shrink(target, job.maxSide);
		} catch (err) {
			console.error(`Stopped at ${job.file}: ${err.message}`);
			break;
		}
		manifest[job.file] = job.prompt;
		made++;
		console.log(`${made}. ${job.file}`);
	}
	fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
	writeSources(manifest);
	console.log(`${made} made, ${jobs.filter((job) => manifest[job.file] !== job.prompt).length} still missing.`);
}

main().catch((err) => {
	console.error(err.message);
	process.exit(1);
});

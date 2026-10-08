// Web encodes for the site: every tutorial and the complete-workflow video, per language.
// Reads the upload manifest written by the recording pipeline (youtube-upload/videos.json in
// the local "Annotate Demos" folder) and writes videos/<locale>/<id>.mp4 plus a JPEG poster.
// 1440 x 930, H.264, silent, faststart. Existing outputs are skipped unless --force is given.
// Usage: node scripts/encode-videos.mjs [path/to/videos.json] [--force] [--only=<id>]
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const manifestPath = args.find((a) => !a.startsWith('--'))
  ?? '/Users/patrickkang/Documents/Annotate Demos/youtube-upload/videos.json';
const force = args.includes('--force');
const only = args.find((a) => a.startsWith('--only='))?.slice(7);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const sourceDir = path.dirname(manifestPath);

// Poster frame: the intro card for the complete workflow, a few seconds in for tutorials.
const POSTER_AT = { 'full-workflow': 1.5 };

for (const video of manifest) {
  if (only && video.id !== only) continue;
  const source = path.join(sourceDir, video.locale, video.file);
  const dir = path.join(root, 'videos', video.locale);
  const out = path.join(dir, `${video.id}.mp4`);
  const poster = path.join(dir, `${video.id}.jpg`);
  mkdirSync(dir, { recursive: true });
  if (!force && existsSync(out) && existsSync(poster)) continue;
  const tmp = `${out}.part.mp4`;
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', source,
    '-vf', 'scale=1440:930:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '26',
    '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-an', '-movflags', '+faststart', tmp], { stdio: 'inherit' });
  renameSync(tmp, out);
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(POSTER_AT[video.id] ?? 3), '-i', out,
    '-frames:v', '1', '-q:v', '4', poster], { stdio: 'inherit' });
  console.log(`${video.locale}/${video.id}: ${(statSync(out).size / 1e6).toFixed(1)} MB`);
}

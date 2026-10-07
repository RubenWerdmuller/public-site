import { readFile, writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
const sources = JSON.parse(await readFile('scripts/photo-sources.json', 'utf8'));
await mkdir('public/photos', { recursive: true });
const counts = {}; const credits = [];
for (const entry of sources) {
  if ((counts[entry.theme] ?? 0) >= 4) continue;
  const id = `${entry.theme}-${(counts[entry.theme] ?? 0) + 1}`;
  try {
    const response = await fetch(`${entry.url}?w=1000&q=80&fit=max`, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw Error(String(response.status));
    const buffer = Buffer.from(await response.arrayBuffer());
    await sharp(buffer).rotate().resize({ width: 960, height: 640, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toFile(`public/photos/${id}.webp`);
    counts[entry.theme] = (counts[entry.theme] ?? 0) + 1;
    credits.push({ ...entry, id, file: `/photos/${id}.webp`, license: 'Unsplash License', licenseUrl: 'https://unsplash.com/license' });
    console.log(id);
  } catch (error) { console.log('Download failed:', entry.theme, error.message); }
}
await writeFile('public/photos/credits.json', JSON.stringify(credits, null, 2));
await writeFile('lib/photo-library.json', JSON.stringify(credits.map(({ id, file, theme, caption }) => ({ id, file, theme, caption })), null, 2));
console.log('Downloaded', credits.length, 'photos');

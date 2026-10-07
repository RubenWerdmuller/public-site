import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import webpush from 'web-push';

const email = process.argv.find(arg => arg.startsWith('--email='))?.slice(8);
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Use: node scripts/ai-setup.mjs --email=your-contact@example.com');
const keys = webpush.generateVAPIDKeys();
const file = '.env.ai-setup';
await writeFile(file, [
  '# Local setup values. Never commit or paste these in chat. Existing Vercel values are not changed.',
  '# Keep existing VAPID keys if push is already configured.',
  `AI_PIPELINE_SECRET=${randomBytes(32).toString('hex')}`,
  `NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`,
  `VAPID_PRIVATE_KEY=${keys.privateKey}`,
  `VAPID_SUBJECT=mailto:${email}`,
  'AI_GITHUB_REPOSITORY=RubenWerdmuller/public-site',
  'AI_ADMIN_EMAILS=',
  '',
].join('\n'), { flag: 'wx', mode: 0o600 });
console.log(`Setup values saved to ${file}. No secrets are printed. Configure admin emails using your existing app accounts.`);

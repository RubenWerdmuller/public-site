import { execFileSync } from 'node:child_process';
import { readFileSync, lstatSync } from 'node:fs';

export function permittedFile(file) {
  if (!/^(app|components|lib|tests)\//.test(file) || !/\.(ts|tsx|css|json)$/.test(file)) return false;
  if (/^(app\/api\/|app\/ai\/|lib\/(ai-|auth\.|db\.|schema\.|pair-actions\.)|components\/ai-desk\.)/.test(file)) return false;
  return !file.split('/').some(part => part.startsWith('.') || /secret|credential/i.test(part));
}
export function inspectText(text) {
  return !/BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|ghp_[A-Za-z0-9]{30}|github_pat_[A-Za-z0-9_]{30}|sk-[A-Za-z0-9_-]{20}|postgres(?:ql)?:\/\/[^\s]+:[^\s]+@/.test(text);
}
export function guard() {
  const base = process.env.AI_BASE_COMMIT ?? 'HEAD';
  const tracked = execFileSync('git', ['diff', '--name-only', '-z', base], { encoding: 'utf8' }).split('\0').filter(Boolean);
  const added = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
  const files = [...new Set([...tracked, ...added])];
  if (!files.length || files.length > 20) throw new Error('Expected one bounded application change.');
  for (const file of files) {
    if (!permittedFile(file)) throw new Error('The change touches protected files.');
    let stat;
    try { stat = lstatSync(file); } catch { throw new Error('File deletion needs a manual change.'); }
    if (!stat.isFile() || stat.size > 150000 || !inspectText(readFileSync(file, 'utf8'))) throw new Error('The change contains unsupported files or possible credentials.');
  }
  execFileSync('git', ['diff', '--check', base], { stdio: 'inherit' });
}
if (process.argv[1]?.endsWith('ai-code-guard.mjs')) { try { guard(); } catch { console.error('AI change rejected: no bounded change, protected files, deletions, or possible credentials.'); process.exitCode = 1; } }

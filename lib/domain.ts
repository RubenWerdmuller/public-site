export type Attributes = Record<string, number | string>;
export type Option = { title: string; subtitle: string; details: string[]; attributes: Attributes; art: string };
export type Question = { id: string; title: string; intro: string; type: string; theme: string; options: [Option, Option]; informationValue: number };
export type Answer = { user_id: string; question_id: string; choice: number; snapshot: Question; answered_at: string; mode: string };
export const TIMEZONE = 'Europe/Amsterdam';
export function localDay(now = new Date()) { return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now); }
export function localHour(now = new Date()) { return Number(new Intl.DateTimeFormat('en-GB', { timeZone: TIMEZONE, hour: '2-digit', hourCycle: 'h23' }).format(now)); }
export function notificationWindow(now = new Date()) { const h = localHour(now); return h >= 9 && h < 21; }
export function weekKey(now = new Date()) { const d = new Date(`${localDay(now)}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); }
export function reveal(answers: Answer[], userId: string, questionId: string) {
  const own = answers.find(a => a.user_id === userId && a.question_id === questionId);
  const other = answers.find(a => a.user_id !== userId && a.question_id === questionId);
  return { own: own?.choice ?? null, partner: own && other ? other.choice : null, same: own && other ? own.choice === other.choice : null };
}
// Replaceable selection boundary: reward unexplored themes, avoid repeats, preserve type diversity.
export function questionSelector(bank: Question[], answeredIds: string[], recent: Question[], count = 4) {
  const seen = new Set(answeredIds); const themeCounts: Record<string, number> = {};
  recent.forEach(q => { themeCounts[q.theme] = (themeCounts[q.theme] ?? 0) + 1; });
  const ranked = bank.filter(q => !seen.has(q.id)).sort((a, b) => ((themeCounts[a.theme] ?? 0) - (themeCounts[b.theme] ?? 0)) || b.informationValue - a.informationValue || a.id.localeCompare(b.id));
  const picked: Question[] = []; const types = new Set<string>();
  for (const q of ranked) if (!types.has(q.type) && picked.length < count) { picked.push(q); types.add(q.type); }
  for (const q of ranked) if (picked.length < count && !picked.includes(q)) picked.push(q);
  return picked;
}
export function insights(answers: Answer[], userIds: string[]) {
  const complete = [...new Set(answers.map(a => a.question_id))].map(id => answers.filter(a => a.question_id === id)).filter(rows => userIds.length === 2 && userIds.every(id => rows.some(a => a.user_id === id)));
  const same = complete.filter(rows => rows[0].choice === rows[1].choice);
  const estimates: Record<string, { sum: number; count: number }> = {};
  for (const a of answers) {
    const win = a.snapshot.options[a.choice]?.attributes; const lose = a.snapshot.options[1 - a.choice]?.attributes;
    if (!win || !lose) continue;
    for (const key of Object.keys(win)) if (typeof win[key] === 'number' && typeof lose[key] === 'number' && win[key] !== lose[key]) {
      const k = `${a.user_id}:${key}`; const estimate = estimates[k] ?? { sum: 0, count: 0 }; estimate.sum += Math.sign(Number(win[key]) - Number(lose[key])); estimate.count++; estimates[k] = estimate;
    }
  }
  return { complete: complete.length, same: same.length, match: complete.length ? Math.round(same.length / complete.length * 100) : null, agreements: same.map(rows => rows[0].snapshot.theme), differences: complete.filter(rows => rows[0].choice !== rows[1].choice).map(rows => rows[0].snapshot.title), estimates };
}
export function createReport(answers: Answer[], userIds: string[]) {
  const summary = insights(answers, userIds);
  const selected = answers.map(a => a.snapshot.options[a.choice].attributes);
  const mean = (key: string, fallback: number) => { const nums = selected.map(a => a[key]).filter((v): v is number => typeof v === 'number'); return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : fallback; };
  const days = mean('days', 14); const nature = mean('nature', 2); const pace = mean('pace', 2); const comfort = mean('comfort', 2);
  const enough = answers.length >= 6;
  return { ...summary, answerCount: answers.length, dna: enough ? `Jullie gekozen reizen wijzen voorzichtig richting ${days > 14 ? 'langer op pad' : 'een overzichtelijke reis'}, met ${nature >= 3 ? 'veel natuur' : 'een mix van plekken'} en ${pace <= 2 ? 'tijd om te blijven hangen' : 'ruimte voor avontuur'}. ${comfort >= 3 ? 'Comfort komt regelmatig terug.' : 'Een eenvoudige slaapplek mag, als de rest klopt.'}` : 'Jullie reisverhaal begint net. Met een paar extra keuzes ontdekken we wat steeds terugkomt.', discovery: summary.complete >= 4 ? `${summary.same} van de ${summary.complete} samen beantwoorde dilemma’s wijzen dezelfde kant op. Let in de komende week op wat er verandert als prijs, duur of seizoen meeweegt.` : 'Nog te weinig gezamenlijke keuzes voor een nieuw patroon. We gaan niets verzinnen.', fantasy: enough ? `${days} dagen. ${nature >= 3 ? 'Slovenië en de Italiaanse bergen' : 'Porto en de Portugese kust'}. ${pace <= 2 ? 'Twee rustige uitvalsbases' : 'Vier plekken om te ontdekken'}. ${comfort >= 3 ? 'Een bijzonder verblijf als middelpunt' : 'Kleine huisjes, met één nacht die je bijblijft'}. Goed eten en genoeg ruimte om af te wijken.` : 'Een eerste schets: twee weken, een fijne treinreis, een huisje in het groen. Deze voorbeeldreis wordt persoonlijk zodra jullie meer antwoorden geven.', provisional: !enough };
}

import Link from 'next/link';
import { currentUser } from '@/lib/auth';
import { isAiAdmin, listTasks } from '@/lib/ai-tasks';
import { AiDesk } from '@/components/ai-desk';
import './ai.css';

export const dynamic = 'force-dynamic';
export default async function AiPage() {
  const user = await currentUser();
  if (!user || !isAiAdmin(user.email)) return <main className="ai-page"><div className="content"><Link href="/">← Naar jullie reisboekje</Link><section className="paper"><h1>AI-opdrachten</h1><p>{user ? 'Deze pagina is alleen beschikbaar voor de ingestelde beheerders.' : 'Log op de startpagina in om jullie AI-opdrachten te bekijken.'}</p></section></div></main>;
  return <AiDesk initialTasks={await listTasks(user)} />;
}

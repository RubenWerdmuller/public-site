import { Avatar } from './illustrations';
import { CHARACTERS } from '@/lib/characters';

type Traveler = { id: string; name: string; avatar: number };
export function Travelers({members = Object.values(CHARACTERS), activeId, size = 44, status}: { members?: Traveler[]; activeId?: string; size?: number; status?: (id: string) => string }) {
  return <div className="travelers" aria-label="Jullie reisgenoten">{members.map(person => <div key={person.id} className={`traveler ${activeId === person.id ? 'is-active' : ''}`}><Avatar id={person.avatar} size={size}/><div><span>{person.name}</span>{status && <small>{status(person.id)}</small>}</div></div>)}</div>;
}

import type { LucideIcon } from 'lucide-react';
import { Accessibility, Sun, User, Users } from 'lucide-react';

export interface TicketType {
  key: string;
  label: string;
  detail: string;
  color: string;
  icon: LucideIcon;
}

export const TICKET_TYPES: TicketType[] = [
  {
    key: 'adulto',
    label: 'Entrada general adulto',
    detail: 'Acceso general · 18+',
    color: 'var(--color-primary)',
    icon: User,
  },
  {
    key: 'infantil',
    label: 'Entrada general infantil',
    detail: 'De 3 a 17 años',
    color: 'var(--color-success)',
    icon: Users,
  },
  {
    key: 'adultoMayor',
    label: 'Adulto mayor',
    detail: 'Con identificación vigente',
    color: 'var(--color-warning)',
    icon: Accessibility,
  },
  {
    key: 'festival',
    label: 'Festival de verano',
    detail: 'Especial de temporada',
    color: 'var(--color-danger)',
    icon: Sun,
  },
];

export const TICKET_KEYS = TICKET_TYPES.map(({ key }) => key);

import { Atom, Orbit, ScanEye, Baby, TreePine, Share2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type CategoryStyle = { name: string; color: string; icon: LucideIcon };

export const categories: CategoryStyle[] = [
    { name: "Física", color: "var(--brand-blue)", icon: Atom },
    { name: "Astronomía", color: "var(--brand-green)", icon: Orbit },
    { name: "Óptica", color: "var(--brand-red-light)", icon: ScanEye },
    { name: "Infantil", color: "var(--brand-yellow)", icon: Baby },
    { name: "Ambiente", color: "var(--brand-teal)", icon: TreePine },
    { name: "Tecnología", color: "var(--brand-purple)", icon: Share2 },
];
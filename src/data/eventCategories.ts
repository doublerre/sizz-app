import { Atom, Orbit, ScanEye, Baby, TreePine, Share2, Sparkles } from "lucide-react";
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

// Colores disponibles para categorías que no están en la lista
const palette = [
    "var(--brand-blue)",
    "var(--brand-purple)",
    "var(--brand-green)",
    "var(--brand-yellow)",
    "var(--brand-red-light)",
];


export function normalize(text: string): string {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}


function fallbackColor(category: string): string {
    let hash = 0;
    for (const char of category) {
        hash = (hash * 31 + char.charCodeAt(0)) % 1000003;
    }
    return palette[hash % palette.length];
}


export function getCategoryStyle(category: string | null): CategoryStyle {
    const name = category ?? "General";
    const found = categories.find((c) => normalize(c.name) === normalize(name));
    return found ?? { name, color: fallbackColor(name), icon: Sparkles };
}
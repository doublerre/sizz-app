const MAX_AGE_MS = 5 * 60 * 1000;

let owner: string | null = null; // usuario al que pertenece el dato
let open: boolean | null = null; // null = todavía no se sabe
let checkedAt = 0;
const listeners = new Set<() => void>();

export const shiftStatus = {
    subscribe(listener: () => void) {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    },

    // Solo devuelve el dato si es del usuario que pregunta
    get(userId: string): boolean | null {
        return owner === userId ? open : null;
    },

    // true si hay que preguntarle al servidor: no se sabe, es de otro usuario o ya es viejo
    needsCheck(userId: string): boolean {
        if (owner !== userId) {
            owner = userId;
            open = null;
            checkedAt = 0;
        }
        return open === null || Date.now() - checkedAt > MAX_AGE_MS;
    },

    set(value: boolean) {
        open = value;
        checkedAt = Date.now();
        listeners.forEach((listener) => listener());
    },
};
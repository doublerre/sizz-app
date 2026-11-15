// Guarda en el navegador el estado del turno para coordinar la apertura entre pantallas.
const SHIFT_OPEN_KEY = "sizz_taquilla_shift_open";
const SHIFT_FLAG_EVENT = "sizz:taquilla-shift-flag";

export function isBoxOfficeShiftOpen() {
  return localStorage.getItem(SHIFT_OPEN_KEY) === "true";
}

//Guarda la flag
export function setBoxOfficeShiftOpen(isOpen: boolean) {
  if (isOpen) {
    localStorage.setItem(SHIFT_OPEN_KEY, "true");
  } else {
    localStorage.removeItem(SHIFT_OPEN_KEY);
  }

  window.dispatchEvent(new Event(SHIFT_FLAG_EVENT));
}

export function subscribeToBoxOfficeShiftFlag(onChange: () => void) {
  window.addEventListener(SHIFT_FLAG_EVENT, onChange);
  window.addEventListener("storage", onChange);

  //Se limpia la flag
  return () => {
    window.removeEventListener(SHIFT_FLAG_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

import { createContext, useContext } from "react";

export type ToastType = "success" | "error" | "info";
export const ToastContext = createContext<Record<
  ToastType,
  (message: string) => void
> | null>(null);

export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error("useToast debe usarse dentro de ToastProvider");
  return toast;
}

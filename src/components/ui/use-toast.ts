import { useState } from "react";
type Toast = { id: string; title?: string; description?: string; variant?: "default" | "destructive" };
let toastFn: (t: Omit<Toast, "id">) => void = () => {};
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  toastFn = (t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...t, id }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 3500);
  };
  return { toasts, toast: toastFn };
}
export const toast = (t: Omit<Toast, "id">) => toastFn(t);

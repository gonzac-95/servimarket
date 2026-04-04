import { useToast } from "./use-toast";
export function Toaster() {
  const { toasts } = useToast();
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(({ id, title, description, variant }) => (
        <div key={id} className={`rounded-lg px-4 py-3 shadow-lg text-sm max-w-sm ${variant === "destructive" ? "bg-red-600 text-white" : "bg-white border text-gray-900"}`}>
          {title && <div className="font-semibold">{title}</div>}
          {description && <div className="opacity-80">{description}</div>}
        </div>
      ))}
    </div>
  );
}

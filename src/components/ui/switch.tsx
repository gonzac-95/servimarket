import { cn } from "../../lib/utils";
interface SwitchProps { checked?: boolean; onCheckedChange?: (v: boolean) => void; className?: string; }
export function Switch({ checked, onCheckedChange, className }: SwitchProps) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onCheckedChange?.(!checked)}
      className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring", checked ? "bg-indigo-600" : "bg-gray-200", className)}>
      <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", checked ? "translate-x-6" : "translate-x-1")} />
    </button>
  );
}

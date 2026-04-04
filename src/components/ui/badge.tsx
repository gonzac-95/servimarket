import { cn } from "../../lib/utils";
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default"|"secondary"|"outline"|"destructive";
}
export function Badge({ className, variant="default", ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: "bg-indigo-600 text-white",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border border-input",
    destructive: "bg-red-100 text-red-700",
  };
  return <div className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", variants[variant], className)} {...props} />;
}

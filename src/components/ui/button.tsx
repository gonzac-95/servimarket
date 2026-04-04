import { forwardRef } from "react";
import { cn } from "../../lib/utils";
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default"|"outline"|"ghost"|"destructive"|"hero"|"glass";
  size?: "default"|"sm"|"lg"|"xl"|"icon";
  asChild?: boolean;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant="default", size="default", asChild=false, children, ...props }, ref) => {
    const base = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:pointer-events-none";
    const variants: Record<string, string> = {
      default: "bg-indigo-600 text-white hover:bg-indigo-700",
      outline: "border border-input bg-background hover:bg-muted",
      ghost: "hover:bg-muted",
      destructive: "bg-red-600 text-white hover:bg-red-700",
      hero: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg",
      glass: "bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20",
    };
    const sizes: Record<string, string> = {
      default: "h-10 px-4 py-2 text-sm",
      sm: "h-8 px-3 text-xs",
      lg: "h-11 px-6 text-base",
      xl: "h-12 px-8 text-base",
      icon: "h-10 w-10",
    };
    if (asChild && children) {
      const child = children as React.ReactElement;
      return { ...child, props: { ...child.props, className: cn(base, variants[variant], sizes[size], className), ref } };
    }
    return <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props}>{children}</button>;
  }
);
Button.displayName = "Button";

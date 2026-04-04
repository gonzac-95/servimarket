import React from 'react';
import { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";
import { ChevronDown } from "lucide-react";
interface SelectProps { value?: string; onValueChange?: (v: string) => void; children: React.ReactNode; }
export function Select({ value, onValueChange, children }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div ref={ref} className="relative">
      {React.Children.map(children, child => {
        if (!React.isValidElement(child)) return child;
        if ((child.type as any).displayName === "SelectTrigger") return React.cloneElement(child as any, { onClick: () => setOpen(!open), value });
        if ((child.type as any).displayName === "SelectContent") return open ? React.cloneElement(child as any, { onSelect: (v: string) => { onValueChange?.(v); setOpen(false); } }) : null;
        return child;
      })}
    </div>
  );
}
export function SelectTrigger({ className, children, onClick, value, placeholder }: any) {
  return (
    <button type="button" onClick={onClick} className={cn("flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring", className)}>
      <span className={value ? "" : "text-muted-foreground"}>{value || placeholder || "Seleccionar..."}</span>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
}
SelectTrigger.displayName = "SelectTrigger";
export function SelectContent({ children, onSelect, className }: any) {
  return (
    <div className={cn("absolute top-full left-0 z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg", className)}>
      {React.Children.map(children, child =>
        React.isValidElement(child) ? React.cloneElement(child as any, { onSelect }) : child
      )}
    </div>
  );
}
SelectContent.displayName = "SelectContent";
export function SelectItem({ value, children, onSelect, className }: any) {
  return (
    <div onClick={() => onSelect?.(value)} className={cn("cursor-pointer px-3 py-2 text-sm hover:bg-muted", className)}>
      {children}
    </div>
  );
}
export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span>{placeholder}</span>;
}

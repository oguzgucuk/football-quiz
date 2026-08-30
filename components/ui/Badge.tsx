import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "brand";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variantStyles = {
    default: "bg-zinc-800 text-zinc-300 border-zinc-700",
    success: "bg-emerald-950/80 text-emerald-300 border-emerald-800/60",
    warning: "bg-amber-950/80 text-amber-300 border-amber-800/60",
    danger: "bg-rose-950/80 text-rose-300 border-rose-800/60",
    brand: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  };

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm",
          variantStyles[variant],
          className
        )
      )}
    >
      {children}
    </span>
  );
}

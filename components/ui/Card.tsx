import React, { HTMLAttributes } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "glow";
}

export function Card({
  children,
  className,
  variant = "default",
  ...props
}: CardProps) {
  const variantStyles = {
    default: "bg-zinc-900/80 border-zinc-800/80 text-zinc-100",
    glass:
      "bg-zinc-900/40 backdrop-blur-xl border-zinc-800/60 text-zinc-100 shadow-2xl",
    glow: "bg-zinc-900/60 backdrop-blur-xl border-emerald-500/20 shadow-xl shadow-emerald-500/5 text-zinc-100",
  };

  return (
    <div
      className={twMerge(
        clsx(
          "rounded-2xl border p-6 transition-all duration-300",
          variantStyles[variant],
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}

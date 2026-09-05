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
    default: "bg-[#0c1612]/85 backdrop-blur-xl border-white/10 text-white shadow-lg",
    glass:
      "bg-[#0c1612]/90 backdrop-blur-2xl border-white/15 text-white shadow-[0_0_50px_rgba(0,0,0,0.8)]",
    glow: "bg-[#0c1612]/90 backdrop-blur-2xl border-emerald-500/30 shadow-[0_0_40px_rgba(34,197,94,0.15)] text-white",
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

"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#0c1612]/95 group-[.toaster]:text-zinc-100 group-[.toaster]:border-white/15 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:backdrop-blur-xl",
          description: "group-[.toast]:text-zinc-400",
          actionButton:
            "group-[.toast]:bg-emerald-600 group-[.toast]:text-white group-[.toast]:font-bold group-[.toast]:rounded-xl",
          cancelButton:
            "group-[.toast]:bg-zinc-800 group-[.toast]:text-zinc-300 group-[.toast]:rounded-xl",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

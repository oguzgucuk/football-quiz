import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind sınıflarını güvenli şekilde birleştiren yardımcı fonksiyon (Class Names Merger).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
